const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('studyvault');

    // Check if data already exists to prevent duplicates
    const existingPrograms = await db.collection('programs').countDocuments();
    if (existingPrograms > 0) {
      console.log('⚠️  Database already seeded. Skipping seed operation.');
      return;
    }

    console.log('🌱 Starting database seeding...\n');

    // Seed Programs
    const programs = [
      {
        _id: new ObjectId(),
        name: 'Federal Board of Intermediate & Secondary Education (FBISE)',
        slug: 'fbise',
        short_name: 'FBISE',
        program_type: 'academic',
        description: 'Federal Board curriculum for Grades 9-12 across Pakistan',
        icon_url: '/icons/fbise.svg',
        color_hex: '#01411C',
        display_order: 1,
        is_active: true,
        is_featured: true,
        access_tier: 'basic',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'Lahore Board (BISE Lahore)',
        slug: 'lahore-board',
        short_name: 'LHR',
        program_type: 'academic',
        description: 'Board of Intermediate and Secondary Education, Lahore',
        icon_url: '/icons/lahore.svg',
        color_hex: '#065f46',
        display_order: 2,
        is_active: true,
        is_featured: true,
        access_tier: 'basic',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'Karachi Board (BIEK)',
        slug: 'karachi-board',
        short_name: 'KHI',
        program_type: 'academic',
        description: 'Board of Intermediate Education, Karachi',
        icon_url: '/icons/karachi.svg',
        color_hex: '#047857',
        display_order: 3,
        is_active: true,
        is_featured: false,
        access_tier: 'basic',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('programs').insertMany(programs);
    console.log('✅ Programs seeded:', programs.length);

    // Seed Boards
    const boards = [
      {
        _id: new ObjectId(),
        name: 'Federal Board of Intermediate & Secondary Education',
        slug: 'fbise',
        short_code: 'FBISE',
        city: 'Islamabad',
        province: 'Islamabad Capital Territory',
        country: 'Pakistan',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'Board of Intermediate and Secondary Education, Lahore',
        slug: 'lahore-board',
        short_code: 'LHR',
        city: 'Lahore',
        province: 'Punjab',
        country: 'Pakistan',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'Board of Intermediate Education, Karachi',
        slug: 'karachi-board',
        short_code: 'KHI',
        city: 'Karachi',
        province: 'Sindh',
        country: 'Pakistan',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('boards').insertMany(boards);
    console.log('✅ Boards seeded:', boards.length);

    // Seed Books for FBISE Grade 9
    const fbiseProgram = programs[0];
    const fbiseBoard = boards[0];

    const books = [
      {
        _id: new ObjectId(),
        title: 'Physics - Grade 9',
        slug: 'physics-grade-9-fbise',
        subject: 'Physics',
        subject_slug: 'physics',
        program_id: fbiseProgram._id,
        board_id: fbiseBoard._id,
        edition_year: 2024,
        edition_label: '2024 Edition',
        is_current_edition: true,
        metadata: {
          authors: ['Dr. Muhammad Aslam', 'Prof. Ahmed Khan'],
          publisher: 'National Book Foundation',
          publication_city: 'Islamabad',
          language: 'english',
          script_direction: 'ltr',
          grade_level: '9',
        },
        seo: {
          meta_title: 'Grade 9 Physics - FBISE | StudyVault PK',
          meta_description: 'Complete Grade 9 Physics textbook according to FBISE syllabus',
          keywords: ['physics', 'grade 9', 'fbise', 'pakistani', 'textbook'],
        },
        total_chapters: 0,
        total_topics: 0,
        ingestion_status: 'complete',
        is_live: true,
        created_by: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        title: 'Chemistry - Grade 9',
        slug: 'chemistry-grade-9-fbise',
        subject: 'Chemistry',
        subject_slug: 'chemistry',
        program_id: fbiseProgram._id,
        board_id: fbiseBoard._id,
        edition_year: 2024,
        edition_label: '2024 Edition',
        is_current_edition: true,
        metadata: {
          authors: ['Dr. Fatima Ali', 'Prof. Hassan Mahmood'],
          publisher: 'National Book Foundation',
          publication_city: 'Islamabad',
          language: 'english',
          script_direction: 'ltr',
          grade_level: '9',
        },
        seo: {
          meta_title: 'Grade 9 Chemistry - FBISE | StudyVault PK',
          meta_description: 'Complete Grade 9 Chemistry textbook according to FBISE syllabus',
          keywords: ['chemistry', 'grade 9', 'fbise', 'pakistani', 'textbook'],
        },
        total_chapters: 0,
        total_topics: 0,
        ingestion_status: 'complete',
        is_live: true,
        created_by: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        title: 'Mathematics - Grade 9',
        slug: 'mathematics-grade-9-fbise',
        subject: 'Mathematics',
        subject_slug: 'mathematics',
        program_id: fbiseProgram._id,
        board_id: fbiseBoard._id,
        edition_year: 2024,
        edition_label: '2024 Edition',
        is_current_edition: true,
        metadata: {
          authors: ['Prof. Abdul Rashid', 'Dr. Saima Beg'],
          publisher: 'National Book Foundation',
          publication_city: 'Islamabad',
          language: 'english',
          script_direction: 'ltr',
          grade_level: '9',
        },
        seo: {
          meta_title: 'Grade 9 Mathematics - FBISE | StudyVault PK',
          meta_description: 'Complete Grade 9 Mathematics textbook according to FBISE syllabus',
          keywords: ['mathematics', 'math', 'grade 9', 'fbise', 'pakistani', 'textbook'],
        },
        total_chapters: 0,
        total_topics: 0,
        ingestion_status: 'complete',
        is_live: true,
        created_by: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('books').insertMany(books);
    console.log('✅ Books seeded:', books.length);

    // Seed Chapters for Physics Grade 9
    const physicsBook = books[0];
    const physicsChapters = [
      {
        _id: new ObjectId(),
        title: 'Physical Quantities and Measurement',
        slug: 'physical-quantities-and-measurement',
        chapter_number: 1,
        chapter_number_display: 'Chapter 1',
        book_id: physicsBook._id,
        program_id: fbiseProgram._id,
        board_id: fbiseBoard._id,
        student_learning_outcomes: [
          'Define physics and its importance',
          'Understand physical quantities and their units',
          'Learn about measuring instruments',
          'Calculate uncertainties in measurements',
        ],
        summary: 'This chapter introduces the fundamental concepts of physics, physical quantities, SI units, and measurement techniques.',
        page_start: 1,
        page_end: 28,
        total_topics: 0,
        exam_frequency: [
          {
            board_id: fbiseBoard._id,
            board_short_code: 'FBISE',
            total_appearances: 15,
            last_appeared_year: 2023,
            is_hot: true,
          },
        ],
        seo: {
          meta_title: 'Chapter 1: Physical Quantities - Grade 9 Physics',
          meta_description: 'Learn about physical quantities, SI units, and measurement techniques',
          keywords: ['physics', 'measurement', 'SI units', 'grade 9'],
        },
        is_live: true,
        display_order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        title: 'Kinematics',
        slug: 'kinematics',
        chapter_number: 2,
        chapter_number_display: 'Chapter 2',
        book_id: physicsBook._id,
        program_id: fbiseProgram._id,
        board_id: fbiseBoard._id,
        student_learning_outcomes: [
          'Understand motion and its types',
          'Calculate velocity and acceleration',
          'Analyze graphs of motion',
          'Apply equations of motion',
        ],
        summary: 'Study of motion without considering its causes, including displacement, velocity, acceleration, and equations of motion.',
        page_start: 29,
        page_end: 56,
        total_topics: 0,
        exam_frequency: [
          {
            board_id: fbiseBoard._id,
            board_short_code: 'FBISE',
            total_appearances: 20,
            last_appeared_year: 2023,
            is_hot: true,
          },
        ],
        seo: {
          meta_title: 'Chapter 2: Kinematics - Grade 9 Physics',
          meta_description: 'Learn about motion, velocity, acceleration, and equations of motion',
          keywords: ['kinematics', 'motion', 'velocity', 'acceleration', 'grade 9'],
        },
        is_live: true,
        display_order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        title: 'Dynamics',
        slug: 'dynamics',
        chapter_number: 3,
        chapter_number_display: 'Chapter 3',
        book_id: physicsBook._id,
        program_id: fbiseProgram._id,
        board_id: fbiseBoard._id,
        student_learning_outcomes: [
          'Understand force and its effects',
          "Learn Newton's Laws of Motion",
          'Calculate momentum and impulse',
          'Apply conservation of momentum',
        ],
        summary: 'Study of motion and its causes, including force, Newton\'s laws, momentum, and friction.',
        page_start: 57,
        page_end: 88,
        total_topics: 0,
        exam_frequency: [
          {
            board_id: fbiseBoard._id,
            board_short_code: 'FBISE',
            total_appearances: 18,
            last_appeared_year: 2023,
            is_hot: true,
          },
        ],
        seo: {
          meta_title: 'Chapter 3: Dynamics - Grade 9 Physics',
          meta_description: "Learn about force, Newton's laws, momentum, and friction",
          keywords: ['dynamics', 'force', 'newton', 'momentum', 'grade 9'],
        },
        is_live: true,
        display_order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('chapters').insertMany(physicsChapters);
    console.log('✅ Chapters seeded:', physicsChapters.length);

    // Seed Topics for Chapter 1
    const chapter1 = physicsChapters[0];
    const chapter1Topics = [
      {
        _id: new ObjectId(),
        title: 'Introduction to Physics',
        title_urdu: 'طبیعیات کا تعارف',
        slug: 'introduction-to-physics',
        topic_number: '1.1',
        display_order: 1,
        book_id: physicsBook._id,
        chapter_id: chapter1._id,
        program_id: fbiseProgram._id,
        board_id: fbiseBoard._id,
        program_name: fbiseProgram.name,
        subject_name: 'Physics',
        chapter_number: 1,
        chapter_title: chapter1.title,
        raw_text: `# Introduction to Physics

Physics is the branch of science that deals with matter, energy, motion, force, space, and time. It is one of the most fundamental scientific disciplines.

## What is Physics?

Physics seeks to understand the basic principles that govern natural phenomena. It studies everything from the smallest particles in the universe to the largest galaxies.

The word "physics" comes from the Greek word "physis," which means nature.

## Branches of Physics

1. **Mechanics**: Study of motion and forces
2. **Thermodynamics**: Study of heat and temperature
3. **Electromagnetism**: Study of electricity and magnetism
4. **Optics**: Study of light
5. **Quantum Physics**: Study of atomic and subatomic particles
6. **Relativity**: Study of space, time, and gravity

## Importance of Physics in Daily Life

- Understanding natural phenomena like rainbows, thunder, and eclipses
- Development of technology: smartphones, computers, medical equipment
- Energy production: solar panels, nuclear power plants
- Transportation: cars, airplanes, rockets
- Medical applications: X-rays, MRI, ultrasound`,
        clean_html: `<h1>Introduction to Physics</h1><p>Physics is the branch of science that deals with matter, energy, motion, force, space, and time.</p>`,
        content_blocks: [
          {
            type: 'heading',
            text: 'Introduction to Physics',
            level: 1,
            block_order: 1,
          },
          {
            type: 'paragraph',
            text: 'Physics is the branch of science that deals with matter, energy, motion, force, space, and time. It is one of the most fundamental scientific disciplines.',
            block_order: 2,
          },
          {
            type: 'callout',
            variant: 'info',
            title: 'Did You Know?',
            text: 'The word "physics" comes from the Greek word "physis," which means nature.',
            block_order: 3,
          },
        ],
        keywords: ['physics', 'introduction', 'science', 'nature', 'energy'],
        difficulty: 'easy',
        estimated_read_time: 5,
        edition_year: 2024,
        version_status: 'new',
        is_live: true,
        workflow_status: 'live',
        seo: {
          meta_title: 'Introduction to Physics - Grade 9 Chapter 1',
          meta_description: 'Learn what physics is and why it matters in daily life',
          keywords: ['physics', 'introduction', 'grade 9', 'science'],
        },
        created_by: new ObjectId(),
        approved_by: new ObjectId(),
        approved_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        title: 'Physical Quantities',
        title_urdu: 'طبیعی مقداریں',
        slug: 'physical-quantities',
        topic_number: '1.2',
        display_order: 2,
        book_id: physicsBook._id,
        chapter_id: chapter1._id,
        program_id: fbiseProgram._id,
        board_id: fbiseBoard._id,
        program_name: fbiseProgram.name,
        subject_name: 'Physics',
        chapter_number: 1,
        chapter_title: chapter1.title,
        raw_text: `# Physical Quantities

A physical quantity is something that can be measured. Examples include length, mass, time, temperature, etc.

## Base Quantities

Base quantities are fundamental quantities that cannot be expressed in terms of other quantities. There are seven base quantities in the International System of Units (SI):

1. **Length** - meter (m)
2. **Mass** - kilogram (kg)
3. **Time** - second (s)
4. **Electric Current** - ampere (A)
5. **Temperature** - kelvin (K)
6. **Amount of Substance** - mole (mol)
7. **Luminous Intensity** - candela (cd)

## Derived Quantities

Derived quantities are those that can be expressed in terms of base quantities through mathematical operations.

Examples:
- **Speed** = distance/time (m/s)
- **Area** = length × width (m²)
- **Volume** = length × width × height (m³)
- **Force** = mass × acceleration (kg·m/s² or N)
- **Energy** = force × distance (N·m or J)`,
        clean_html: `<h1>Physical Quantities</h1><p>A physical quantity is something that can be measured.</p>`,
        content_blocks: [
          {
            type: 'heading',
            text: 'Physical Quantities',
            level: 1,
            block_order: 1,
          },
          {
            type: 'definition',
            term: 'Physical Quantity',
            definition: 'A property of a material or system that can be quantified by measurement.',
            block_order: 2,
          },
          {
            type: 'table',
            headers: ['Base Quantity', 'SI Unit', 'Symbol'],
            rows: [
              ['Length', 'meter', 'm'],
              ['Mass', 'kilogram', 'kg'],
              ['Time', 'second', 's'],
              ['Electric Current', 'ampere', 'A'],
              ['Temperature', 'kelvin', 'K'],
            ],
            caption: 'Seven Base Quantities in SI System',
            block_order: 3,
          },
          {
            type: 'callout',
            variant: 'note',
            title: 'Important Note',
            text: 'All other physical quantities can be expressed in terms of these seven base quantities.',
            block_order: 4,
          },
        ],
        keywords: ['physical quantities', 'base quantities', 'derived quantities', 'SI units'],
        difficulty: 'medium',
        estimated_read_time: 8,
        edition_year: 2024,
        version_status: 'new',
        is_live: true,
        workflow_status: 'live',
        seo: {
          meta_title: 'Physical Quantities - Base and Derived | Grade 9 Physics',
          meta_description: 'Learn about base and derived physical quantities with examples',
          keywords: ['physical quantities', 'base quantities', 'SI units', 'grade 9'],
        },
        created_by: new ObjectId(),
        approved_by: new ObjectId(),
        approved_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        title: 'International System of Units (SI)',
        title_urdu: 'بین الاقوامی نظامِ اکائیاں',
        slug: 'international-system-of-units-si',
        topic_number: '1.3',
        display_order: 3,
        book_id: physicsBook._id,
        chapter_id: chapter1._id,
        program_id: fbiseProgram._id,
        board_id: fbiseBoard._id,
        program_name: fbiseProgram.name,
        subject_name: 'Physics',
        chapter_number: 1,
        chapter_title: chapter1.title,
        raw_text: `# International System of Units (SI)

The SI system is the modern form of the metric system and is the most widely used system of measurement in the world.

## Why SI Units?

Before SI units, different countries used different measurement systems, causing confusion in trade and science. The SI system provides a universal standard.

## Common SI Prefixes

| Prefix | Symbol | Factor | Example |
|--------|--------|--------|---------|
| Giga | G | 10⁹ | 1 GHz = 1,000,000,000 Hz |
| Mega | M | 10⁶ | 1 MW = 1,000,000 W |
| Kilo | k | 10³ | 1 km = 1,000 m |
| Centi | c | 10⁻² | 1 cm = 0.01 m |
| Milli | m | 10⁻³ | 1 mm = 0.001 m |
| Micro | μ | 10⁻⁶ | 1 μm = 0.000001 m |
| Nano | n | 10⁻⁹ | 1 nm = 0.000000001 m |

## Conversion Examples

1. Convert 5 km to meters:
   5 km = 5 × 1000 = 5000 m

2. Convert 250 g to kilograms:
   250 g = 250 ÷ 1000 = 0.25 kg

3. Convert 3 hours to seconds:
   3 hours = 3 × 60 × 60 = 10,800 s`,
        clean_html: `<h1>International System of Units (SI)</h1><p>The SI system is the modern form of the metric system.</p>`,
        content_blocks: [
          {
            type: 'heading',
            text: 'International System of Units (SI)',
            level: 1,
            block_order: 1,
          },
          {
            type: 'paragraph',
            text: 'The SI system is the modern form of the metric system and is the most widely used system of measurement in the world.',
            block_order: 2,
          },
          {
            type: 'callout',
            variant: 'activity',
            title: 'Quick Activity',
            text: 'Measure your height in centimeters and convert it to meters.',
            block_order: 3,
          },
          {
            type: 'example',
            problem: 'Convert 5 kilometers to meters',
            solution: '5 km = 5 × 1000 = 5000 meters',
            steps: ['Identify the conversion factor: 1 km = 1000 m', 'Multiply: 5 × 1000', 'Result: 5000 m'],
            block_order: 4,
          },
        ],
        keywords: ['SI units', 'metric system', 'prefixes', 'conversion', 'measurement'],
        difficulty: 'medium',
        estimated_read_time: 10,
        edition_year: 2024,
        version_status: 'new',
        is_live: true,
        workflow_status: 'live',
        seo: {
          meta_title: 'SI Units and Prefixes - Grade 9 Physics',
          meta_description: 'Learn about the International System of Units and common prefixes',
          keywords: ['SI units', 'metric system', 'prefixes', 'grade 9', 'physics'],
        },
        created_by: new ObjectId(),
        approved_by: new ObjectId(),
        approved_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('topics').insertMany(chapter1Topics);
    console.log('✅ Topics seeded:', chapter1Topics.length);

    // Update chapter and book counts
    await db.collection('chapters').updateOne(
      { _id: chapter1._id },
      { $set: { total_topics: chapter1Topics.length, topic_ids: chapter1Topics.map(t => t._id) } }
    );

    await db.collection('books').updateOne(
      { _id: physicsBook._id },
      { $set: { total_chapters: physicsChapters.length, total_topics: chapter1Topics.length } }
    );

    // Create demo admin user
    const adminUser = {
      _id: new ObjectId(),
      name: 'Admin User',
      email: 'admin@studyvault.pk',
      password_hash: '$2a$10$demoPasswordHashReplaceInProduction',
      role: 'admin',
      is_verified: true,
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').insertOne(adminUser);
    console.log('✅ Admin user created: admin@studyvault.pk');

    // Create demo student user
    const studentUser = {
      _id: new ObjectId(),
      name: 'Ahmed Khan',
      email: 'student@example.com',
      password_hash: '$2a$10$demoStudentPasswordHashReplaceInProduction',
      role: 'student',
      is_verified: true,
      student_profile: {
        program_ids: [fbiseProgram._id],
        board_id: fbiseBoard._id,
        active_program_id: fbiseProgram._id,
        xp_total: 150,
        streak_days: 5,
        last_active: new Date(),
      },
      subscription: {
        plan: 'premium',
        status: 'active',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        ai_credits_used_today: 2,
        ai_credits_reset_at: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').insertOne(studentUser);
    console.log('✅ Student user created: student@example.com');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${programs.length} Programs`);
    console.log(`   - ${boards.length} Boards`);
    console.log(`   - ${books.length} Books`);
    console.log(`   - ${physicsChapters.length} Chapters (Physics Grade 9)`);
    console.log(`   - ${chapter1Topics.length} Topics (Chapter 1)`);
    console.log(`   - 2 Demo Users (1 Admin, 1 Student)`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin: admin@studyvault.pk');
    console.log('   Student: student@example.com');
    console.log('   (Use your own password hash in production)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n✨ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
