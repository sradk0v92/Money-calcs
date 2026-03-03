import { createClient } from '@supabase/supabase-js';

const STAGES = ['Not started', 'In progress', 'Done'];
const GOALS_PER_CALCULATOR = 12;
const CHUNK_SIZE = 100;

const SAMPLE_USERS = [
  { email: 'sasho@gmail.com', password: 'pass123', full_name: 'Sasho Petrov', role: 'user' },
  { email: 'alex@gmail.com', password: 'pass123', full_name: 'Alex Ivanov', role: 'user' },
  { email: 'gosho@gmail.com', password: 'pass123', full_name: 'Gosho Georgiev', role: 'user' }
];

const CALCULATOR_GOAL_BLUEPRINTS = {
  investment: {
    titlePrefix: 'Investment goal',
    amountStart: 3000,
    amountStep: 1000,
    details: (index) => ({
      monthly_contribution: 200 + index * 25,
      expected_annual_return_percent: 6,
      years: 5 + (index % 6)
    })
  },
  emergency_fund: {
    titlePrefix: 'Emergency fund goal',
    amountStart: 2000,
    amountStep: 500,
    details: (index) => ({
      monthly_expenses: 1000 + index * 120,
      target_months_covered: 3 + (index % 6),
      monthly_saving: 150 + index * 20
    })
  },
  loan: {
    titlePrefix: 'Loan target',
    amountStart: 5000,
    amountStep: 1500,
    details: (index) => ({
      desired_loan_amount: 5000 + index * 1500,
      term_months: 12 + index * 6,
      annual_interest_percent: 5.5 + (index % 5) * 0.4
    })
  }
};

function getEnvValue(...keys) {
  for (const key of keys) {
    if (process.env[key]) {
      return process.env[key];
    }
  }
  return null;
}

function getStageByIndex(index) {
  if (index < 4) return STAGES[0];
  if (index < 8) return STAGES[1];
  return STAGES[2];
}

function getProgressByStage(stage) {
  if (stage === 'Not started') return 0;
  if (stage === 'In progress') return 50;
  return 100;
}

async function insertInChunks(queryBuilderFactory, rows, label) {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await queryBuilderFactory().insert(chunk);
    if (error) {
      throw new Error(`Failed inserting ${label}: ${error.message}`);
    }
  }
}

function buildGoalsForCalculator(calculatorSlug) {
  const blueprint = CALCULATOR_GOAL_BLUEPRINTS[calculatorSlug];
  if (!blueprint) {
    throw new Error(`Missing blueprint for calculator slug: ${calculatorSlug}`);
  }

  const goals = [];
  for (let i = 0; i < GOALS_PER_CALCULATOR; i += 1) {
    const stage = getStageByIndex(i);
    const targetAmount = blueprint.amountStart + i * blueprint.amountStep;
    goals.push({
      title: `${blueprint.titlePrefix} ${i + 1}`,
      stage,
      targetAmount,
      details: blueprint.details(i)
    });
  }

  return goals;
}

function buildRowsForUser(userId, calculatorTypesBySlug) {
  const scenarios = [];
  const calculations = [];

  for (const [slug, calculatorTypeId] of Object.entries(calculatorTypesBySlug)) {
    const goals = buildGoalsForCalculator(slug);

    for (const goal of goals) {
      const progressPercent = getProgressByStage(goal.stage);
      const currentAmount = Math.round((goal.targetAmount * progressPercent) / 100);

      scenarios.push({
        user_id: userId,
        calculator_type_id: calculatorTypeId,
        title: goal.title,
        inputs: {
          goal_type: slug,
          stage: goal.stage,
          target_amount: goal.targetAmount,
          currency: 'EUR',
          current_amount: currentAmount,
          ...goal.details
        }
      });

      calculations.push({
        user_id: userId,
        calculator_type_id: calculatorTypeId,
        inputs: {
          goal_type: slug,
          stage: goal.stage,
          target_amount: goal.targetAmount,
          currency: 'EUR',
          ...goal.details
        },
        results: {
          stage: goal.stage,
          progress_percent: progressPercent,
          current_amount: currentAmount,
          remaining_amount: Math.max(goal.targetAmount - currentAmount, 0),
          status: goal.stage
        }
      });
    }
  }

  return { scenarios, calculations };
}

async function getAllUsers(adminClient) {
  const allUsers = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const pageUsers = data?.users ?? [];
    allUsers.push(...pageUsers);

    if (pageUsers.length < 200) break;
    page += 1;
  }

  return allUsers;
}

async function getOrCreateUserWithServiceRole(adminClient, userSeed, existingUsersByEmail) {
  const existingUser = existingUsersByEmail.get(userSeed.email.toLowerCase());

  if (existingUser) {
    const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
      password: userSeed.password,
      user_metadata: { full_name: userSeed.full_name },
      email_confirm: true
    });

    if (updateError) {
      throw new Error(`Failed to update existing user ${userSeed.email}: ${updateError.message}`);
    }

    return { id: existingUser.id, email: userSeed.email, full_name: userSeed.full_name, role: userSeed.role };
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: userSeed.email,
    password: userSeed.password,
    email_confirm: true,
    user_metadata: { full_name: userSeed.full_name }
  });

  if (createError || !created?.user?.id) {
    throw new Error(`Failed to create user ${userSeed.email}: ${createError?.message ?? 'unknown error'}`);
  }

  return { id: created.user.id, email: userSeed.email, full_name: userSeed.full_name, role: userSeed.role };
}

async function seedForUserClient(userClient, userSeed, userId, calculatorTypesBySlug) {
  const profileRow = {
    id: userId,
    full_name: userSeed.full_name,
    role: userSeed.role
  };

  const { error: profileError } = await userClient
    .from('profiles')
    .upsert(profileRow, { onConflict: 'id' });

  if (profileError) {
    throw new Error(`Failed upserting profile for ${userSeed.email}: ${profileError.message}`);
  }

  const { error: deleteCalculationsError } = await userClient
    .from('calculations')
    .delete()
    .eq('user_id', userId);

  if (deleteCalculationsError) {
    throw new Error(`Failed clearing calculations for ${userSeed.email}: ${deleteCalculationsError.message}`);
  }

  const { error: deleteScenariosError } = await userClient
    .from('scenarios')
    .delete()
    .eq('user_id', userId);

  if (deleteScenariosError) {
    throw new Error(`Failed clearing scenarios for ${userSeed.email}: ${deleteScenariosError.message}`);
  }

  const { scenarios, calculations } = buildRowsForUser(userId, calculatorTypesBySlug);

  await insertInChunks(() => userClient.from('scenarios'), scenarios, `scenarios for ${userSeed.email}`);
  await insertInChunks(() => userClient.from('calculations'), calculations, `calculations for ${userSeed.email}`);

  return {
    scenariosCount: scenarios.length,
    calculationsCount: calculations.length
  };
}

async function runWithServiceRole(supabaseUrl, serviceRoleKey) {
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: calculatorTypes, error: calculatorTypesError } = await adminClient
    .from('calculator_types')
    .select('id, slug')
    .in('slug', ['investment', 'emergency_fund', 'loan']);

  if (calculatorTypesError) {
    throw new Error(`Failed loading calculator types: ${calculatorTypesError.message}`);
  }

  const calculatorTypesBySlug = Object.fromEntries((calculatorTypes ?? []).map((row) => [row.slug, row.id]));
  const requiredSlugs = ['investment', 'emergency_fund', 'loan'];
  const missingSlugs = requiredSlugs.filter((slug) => !calculatorTypesBySlug[slug]);
  if (missingSlugs.length > 0) {
    throw new Error(`Missing calculator types: ${missingSlugs.join(', ')}`);
  }

  const existingUsers = await getAllUsers(adminClient);
  const existingUsersByEmail = new Map(existingUsers.map((u) => [u.email?.toLowerCase(), u]).filter(([email]) => Boolean(email)));

  const finalUsers = [];
  for (const userSeed of SAMPLE_USERS) {
    const user = await getOrCreateUserWithServiceRole(adminClient, userSeed, existingUsersByEmail);
    finalUsers.push(user);
  }

  const { error: upsertProfilesError } = await adminClient
    .from('profiles')
    .upsert(finalUsers.map((u) => ({ id: u.id, full_name: u.full_name, role: u.role })), { onConflict: 'id' });

  if (upsertProfilesError) {
    throw new Error(`Failed upserting profiles: ${upsertProfilesError.message}`);
  }

  const userIds = finalUsers.map((u) => u.id);

  const { error: clearCalculationsError } = await adminClient
    .from('calculations')
    .delete()
    .in('user_id', userIds);

  if (clearCalculationsError) {
    throw new Error(`Failed clearing existing calculations: ${clearCalculationsError.message}`);
  }

  const { error: clearScenariosError } = await adminClient
    .from('scenarios')
    .delete()
    .in('user_id', userIds);

  if (clearScenariosError) {
    throw new Error(`Failed clearing existing scenarios: ${clearScenariosError.message}`);
  }

  let totalScenarios = 0;
  let totalCalculations = 0;

  for (const user of finalUsers) {
    const { scenarios, calculations } = buildRowsForUser(user.id, calculatorTypesBySlug);
    await insertInChunks(() => adminClient.from('scenarios'), scenarios, `scenarios for ${user.email}`);
    await insertInChunks(() => adminClient.from('calculations'), calculations, `calculations for ${user.email}`);
    totalScenarios += scenarios.length;
    totalCalculations += calculations.length;
  }

  console.log('✅ Seed completed with service role key');
  console.log(`Users: ${finalUsers.length}`);
  console.log(`Scenarios inserted: ${totalScenarios}`);
  console.log(`Calculations inserted: ${totalCalculations}`);
  console.log('Per user: 12 goals per calculator x 4 calculators = 48 scenarios + 48 calculations');
}

async function runWithPublishableKey(supabaseUrl, publishableKey) {
  const adminLikeClient = createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: calculatorTypes, error: calculatorTypesError } = await adminLikeClient
    .from('calculator_types')
    .select('id, slug')
    .in('slug', ['investment', 'emergency_fund', 'loan']);

  if (calculatorTypesError) {
    throw new Error(`Failed loading calculator types: ${calculatorTypesError.message}`);
  }

  const calculatorTypesBySlug = Object.fromEntries((calculatorTypes ?? []).map((row) => [row.slug, row.id]));
  const requiredSlugs = ['investment', 'emergency_fund', 'loan'];
  const missingSlugs = requiredSlugs.filter((slug) => !calculatorTypesBySlug[slug]);
  if (missingSlugs.length > 0) {
    throw new Error(`Missing calculator types: ${missingSlugs.join(', ')}`);
  }

  let totalScenarios = 0;
  let totalCalculations = 0;

  for (const userSeed of SAMPLE_USERS) {
    const userClient = createClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { error: signUpError } = await userClient.auth.signUp({
      email: userSeed.email,
      password: userSeed.password,
      options: {
        data: { full_name: userSeed.full_name }
      }
    });

    if (signUpError && !signUpError.message.toLowerCase().includes('already')) {
      throw new Error(`Failed registering ${userSeed.email}: ${signUpError.message}`);
    }

    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email: userSeed.email,
      password: userSeed.password
    });

    if (signInError || !signInData.user) {
      throw new Error(
        `Failed signing in ${userSeed.email}: ${signInError?.message ?? 'no user returned'}. ` +
        'If email confirmation is enabled, run this script with SUPABASE_SERVICE_ROLE_KEY instead.'
      );
    }

    const userId = signInData.user.id;
    const stats = await seedForUserClient(userClient, userSeed, userId, calculatorTypesBySlug);
    totalScenarios += stats.scenariosCount;
    totalCalculations += stats.calculationsCount;
  }

  console.log('✅ Seed completed with publishable/anon key mode');
  console.log(`Users: ${SAMPLE_USERS.length}`);
  console.log(`Scenarios inserted: ${totalScenarios}`);
  console.log(`Calculations inserted: ${totalCalculations}`);
  console.log('Per user: 12 goals per calculator x 4 calculators = 48 scenarios + 48 calculations');
}

async function main() {
  if (process.env.CONFIRM_SAMPLE_SEED !== 'YES') {
    console.error('❌ Aborted: set CONFIRM_SAMPLE_SEED=YES to run this script.');
    process.exit(1);
  }

  const supabaseUrl = getEnvValue('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const serviceRoleKey = getEnvValue('SUPABASE_SERVICE_ROLE_KEY');
  const publishableKey = getEnvValue('SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL).');
  }

  if (!serviceRoleKey && !publishableKey) {
    throw new Error('Missing auth key. Provide SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY.');
  }

  console.log('Starting sample seed...');

  if (serviceRoleKey) {
    await runWithServiceRole(supabaseUrl, serviceRoleKey);
    return;
  }

  await runWithPublishableKey(supabaseUrl, publishableKey);
}

main().catch((error) => {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
});
