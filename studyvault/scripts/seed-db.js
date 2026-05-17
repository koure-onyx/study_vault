const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required. Set it in .env.local');
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('studyvault');

    // Check if data already exists
    const existingPrograms = await db.collection('programs').countDocuments();
    if (existingPrograms > 0) {
      console.log('⚠️  Database already has programs. Skipping seed to prevent duplicates.');
      console.log('   Drop collections first if you want to re-seed: db.dropDatabase()');
      return;
    }

    console.log('🌱 Starting database seeding...\n');

    // ========== 1. Seed Boards ==========
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
        name: 'Board of Intermediate and Secondary Education Lahore',
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
        name: 'Board of Intermediate and Secondary Education Karachi',
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
    console.log(`✅ Created ${boards.length} Boards`);

    // ========== 2. Seed Programs ==========
    const programs = [
      {
        _id: new ObjectId(),
        name: 'Grade 9 (Matric Part 1)',
        slug: 'grade-9',
        short_name: 'Grade 9',
        program_type: 'academic',
        is_linear: true,
        requires_textbook: true,
        description: 'Secondary School Certificate Part 1 - For students aged 14-15',
        icon_url: '/icons/grade9.svg',
        color_hex: '#059669',
        display_order: 1,
        is_active: true,
        is_featured: true,
        access_tier: 'basic',
        applicable_boards: boards.map(b => ({ board_id: b._id, board_name: b.name })),
        created_by: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'Grade 10 (Matric Part 2)',
        slug: 'grade-10',
        short_name: 'Grade 10',
        program_type: 'academic',
        is_linear: true,
        requires_textbook: true,
        description: 'Secondary School Certificate Part 2 - For students aged 15-16',
        icon_url: '/icons/grade10.svg',
        color_hex: '#0284c7',
        display_order: 2,
        is_active: true,
        is_featured: true,
        access_tier: 'basic',
        applicable_boards: boards.map(b => ({ board_id: b._id, board_name: b.name })),
        created_by: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('programs').insertMany(programs);
    console.log(`✅ Created ${programs.length} Programs`);

    // ========== 3. Seed Books (Physics Grade 9 FBISE) ==========
    const physicsBook = {
      _id: new ObjectId(),
      title: 'Physics - Grade 9 (FBISE)',
      slug: 'physics-grade-9-fbise',
      subject: 'Physics',
      subject_slug: 'physics',
      program_id: programs[0]._id,
      board_id: boards[0]._id,
      edition_year: 2024,
      edition_label: '2024 Edition',
      is_current_edition: true,
      previous_edition_id: null,
      metadata: {
        authors: ['National Book Foundation'],
        publisher: 'National Book Foundation',
        publication_city: 'Islamabad',
        isbn: '978-969-0-00000-0',
        total_pages: 180,
        language: 'english',
        script_direction: 'ltr',
        grade_level: '9',
        curriculum_year: 2024,
      },
      seo: {
        meta_title: 'Physics Grade 9 FBISE Textbook - Complete Chapters & Topics',
        meta_description: 'Study Physics Grade 9 according to FBISE syllabus. Complete chapters, solved MCQs, practice questions, and AI-powered explanations.',
        keywords: ['physics', 'grade 9', 'fbise', 'matric', 'pakistan', 'textbook'],
        og_image_url: 'https://studyvault.pk/og/physics-grade-9.jpg',
      },
      total_chapters: 0,
      total_topics: 0,
      ingestion_status: 'complete',
      ingestion_log: ['Seeded manually'],
      is_live: true,
      cover_image_url: 'https://studyvault.pk/covers/physics-9.jpg',
      created_by: null,
      approved_by: null,
      approved_at: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('books').insertOne(physicsBook);
    console.log(`✅ Created Physics Book for Grade 9`);

    // ========== 4. Seed Chapters ==========
    const chapters = [
      {
        _id: new ObjectId(),
        title: 'Physical Quantities and Measurement',
        slug: 'physical-quantities-and-measurement',
        chapter_number: 1,
        chapter_number_display: 'Chapter 1',
        book_id: physicsBook._id,
        program_id: programs[0]._id,
        board_id: boards[0]._id,
        student_learning_outcomes: [
          'Define physics and its importance',
          'Understand physical quantities and their units',
          'Learn about measuring instruments',
        ],
        summary: 'Introduction to physics, physical quantities, SI units, and measurement techniques.',
        summary_urdu: 'طبیعیات، طبیعی مقداریں، اکائیاں اور پیمائش کے طریقوں کا تعارف',
        page_start: 1,
        page_end: 25,
        topic_ids: [],
        total_topics: 0,
        exam_frequency: [{
          board_id: boards[0]._id,
          board_short_code: 'FBISE',
          total_appearances: 15,
          last_appeared_year: 2023,
          is_hot: true,
        }],
        seo: {
          meta_title: 'Chapter 1: Physical Quantities and Measurement - Physics Grade 9',
          meta_description: 'Complete notes for Chapter 1 of Physics Grade 9. Learn about physical quantities, SI units, and measurement.',
          keywords: ['physical quantities', 'measurement', 'SI units', 'physics chapter 1'],
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
        program_id: programs[0]._id,
        board_id: boards[0]._id,
        student_learning_outcomes: [
          'Understand motion and its types',
          'Learn about velocity and acceleration',
          'Solve equations of motion',
        ],
        summary: 'Study of motion without considering its causes. Covers displacement, velocity, acceleration, and equations of motion.',
        summary_urdu: 'حرکت کا مطالعہ بغیر اس کی وجوہات کے۔',
        page_start: 26,
        page_end: 55,
        topic_ids: [],
        total_topics: 0,
        exam_frequency: [{
          board_id: boards[0]._id,
          board_short_code: 'FBISE',
          total_appearances: 20,
          last_appeared_year: 2023,
          is_hot: true,
        }],
        seo: {
          meta_title: 'Chapter 2: Kinematics - Physics Grade 9',
          meta_description: 'Complete notes for Kinematics. Learn about motion, velocity, acceleration, and equations of motion.',
          keywords: ['kinematics', 'motion', 'velocity', 'acceleration', 'physics chapter 2'],
        },
        is_live: true,
        display_order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('chapters').insertMany(chapters);
    console.log(`✅ Created ${chapters.length} Chapters`);

    // ========== 5. Seed Topics for Chapter 1 ==========
    const topicsChapter1 = [
      {
        _id: new ObjectId(),
        title: 'Introduction to Physics',
        title_urdu: 'طبیعیات کا تعارف',
        slug: 'introduction-to-physics',
        topic_number: '1.1',
        display_order: 1,
        book_id: physicsBook._id,
        chapter_id: chapters[0]._id,
        program_id: programs[0]._id,
        board_id: boards[0]._id,
        program_name: 'Grade 9 (Matric Part 1)',
        subject_name: 'Physics',
        chapter_number: 1,
        chapter_title: 'Physical Quantities and Measurement',
        raw_text: `Physics is the branch of science that deals with matter, energy, motion, force, space, and time. It is one of the most fundamental scientific disciplines.

What is Physics?
Physics seeks to understand the basic principles that govern natural phenomena. The word "physics" comes from the Greek word "physis" meaning nature.

Importance of Physics in Daily Life:
1. Transportation: Cars, airplanes, and rockets work on principles of physics.
2. Communication: Mobile phones, radio, and TV use electromagnetic waves.
3. Medicine: X-rays, MRI, and ultrasound are applications of physics.
4. Energy: Power generation from nuclear, solar, and wind sources.
5. Household Appliances: Refrigerators, microwaves, and electric fans.

Branches of Physics:
- Mechanics: Study of motion and forces
- Thermodynamics: Study of heat and temperature
- Optics: Study of light
- Electromagnetism: Study of electricity and magnetism
- Nuclear Physics: Study of atomic nuclei
- Quantum Physics: Study of particles at atomic scale`,
        clean_html: `<h1>Introduction to Physics</h1><p>Physics is the branch of science that deals with matter, energy, motion, force, space, and time.</p><h2>What is Physics?</h2><p>Physics seeks to understand the basic principles that govern natural phenomena.</p><h2>Importance of Physics</h2><ul><li>Transportation</li><li>Communication</li><li>Medicine</li><li>Energy</li><li>Household Appliances</li></ul>`,
        content_blocks: [
          {
            type: 'heading',
            text: 'Introduction to Physics',
            level: 1,
            block_order: 1,
          },
          {
            type: 'paragraph',
            text: 'Physics is the branch of science that deals with matter, energy, motion, force, space, and time.',
            block_order: 2,
          },
          {
            type: 'callout',
            variant: 'info',
            title: 'Did You Know?',
            text: 'The word "physics" comes from the Greek word "physis" meaning nature.',
            block_order: 3,
          },
          {
            type: 'list',
            ordered: false,
            items: ['Transportation', 'Communication', 'Medicine', 'Energy', 'Household Appliances'],
            block_order: 4,
          },
        ],
        formulas: [],
        key_terms: [
          { term: 'Physics', definition: 'The study of matter, energy, and their interactions' },
          { term: 'Matter', definition: 'Anything that has mass and occupies space' },
          { term: 'Energy', definition: 'The ability to do work' },
        ],
        book_mcqs: [],
        book_short_questions: ['Define physics.', 'Name any three branches of physics.'],
        book_problems: [],
        keywords: ['physics', 'introduction', 'branches of physics', 'importance of physics'],
        difficulty: 'easy',
        estimated_read_time: 5,
        edition_year: 2024,
        version_status: 'new',
        previous_version_id: null,
        content_hash: 'abc123hash',
        exam_frequency: [],
        ai_cache: {},
        seo: {
          meta_title: 'Introduction to Physics - Grade 9 Physics Chapter 1',
          meta_description: 'Learn the basics of physics, its importance, and branches. Complete notes for Grade 9 FBISE.',
          keywords: ['introduction to physics', 'what is physics', 'physics grade 9'],
          json_ld: {},
          canonical_url: 'https://studyvault.pk/grade-9/physics/physical-quantities-and-measurement/introduction-to-physics',
          og_image_url: 'https://studyvault.pk/og/intro-physics.jpg',
          source_page: 1,
        },
        is_live: true,
        guest_preview_percent: 50,
        workflow_status: 'live',
        admin_notes: '',
        created_by: null,
        approved_by: null,
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
        chapter_id: chapters[0]._id,
        program_id: programs[0]._id,
        board_id: boards[0]._id,
        program_name: 'Grade 9 (Matric Part 1)',
        subject_name: 'Physics',
        chapter_number: 1,
        chapter_title: 'Physical Quantities and Measurement',
        raw_text: `A physical quantity is something that can be measured. Examples include length, mass, time, temperature, etc.

Base Quantities:
Base quantities are fundamental quantities that cannot be expressed in terms of other quantities. There are seven base quantities in the International System of Units (SI):

1. Length (meter, m) - Distance between two points
2. Mass (kilogram, kg) - Amount of matter in an object
3. Time (second, s) - Duration of an event
4. Electric Current (ampere, A) - Flow of electric charge
5. Temperature (kelvin, K) - Degree of hotness or coldness
6. Amount of Substance (mole, mol) - Number of particles
7. Luminous Intensity (candela, cd) - Brightness of light

Derived Quantities:
Derived quantities are those that can be expressed in terms of base quantities. Examples:
- Speed = Distance / Time (m/s)
- Area = Length × Width (m²)
- Volume = Length × Width × Height (m³)
- Force = Mass × Acceleration (kg·m/s² or Newton)
- Energy = Force × Distance (Joule)`,
        clean_html: `<h1>Physical Quantities</h1><p>A physical quantity is something that can be measured.</p><h2>Base Quantities</h2><p>There are seven base quantities in SI system.</p><h2>Derived Quantities</h2><p>Quantities derived from base quantities.</p>`,
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
            definition: 'Something that can be measured',
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
              ['Amount of Substance', 'mole', 'mol'],
              ['Luminous Intensity', 'candela', 'cd'],
            ],
            caption: 'Seven Base Quantities in SI System',
            block_order: 3,
          },
          {
            type: 'callout',
            variant: 'note',
            title: 'Remember',
            text: 'All other physical quantities are derived from these seven base quantities.',
            block_order: 4,
          },
        ],
        formulas: [
          { latex: 'v = \\frac{d}{t}', label: 'Speed Formula', plain_text: 'v = d/t' },
          { latex: 'F = ma', label: 'Newton\'s Second Law', plain_text: 'F = ma' },
        ],
        key_terms: [
          { term: 'Base Quantity', definition: 'Fundamental quantity that cannot be expressed in terms of others' },
          { term: 'Derived Quantity', definition: 'Quantity expressed in terms of base quantities' },
          { term: 'SI Units', definition: 'International System of Units' },
        ],
        book_mcqs: [
          {
            question: 'How many base quantities are there in SI system?',
            options: ['(a) 5', '(b) 6', '(c) 7', '(d) 8'],
            correct_answer: 'c',
            explanation: 'There are 7 base quantities in the International System of Units (SI).',
            source: 'book',
          },
        ],
        book_short_questions: ['Define physical quantity.', 'Name the seven base quantities.'],
        book_problems: [],
        keywords: ['physical quantities', 'base quantities', 'derived quantities', 'SI units'],
        difficulty: 'medium',
        estimated_read_time: 8,
        edition_year: 2024,
        version_status: 'new',
        previous_version_id: null,
        content_hash: 'def456hash',
        exam_frequency: [{
          board_id: boards[0]._id,
          board_short_code: 'FBISE',
          board_name: 'Federal Board',
          total_appearances: 12,
          appearance_by_year: [
            { year: 2023, count: 5, question_types: ['MCQ', 'Short'] },
            { year: 2022, count: 4, question_types: ['MCQ'] },
          ],
          last_appeared_year: 2023,
          is_hot_topic: true,
        }],
        ai_cache: {},
        seo: {
          meta_title: 'Physical Quantities - Base and Derived Quantities | Grade 9 Physics',
          meta_description: 'Learn about physical quantities, base quantities, derived quantities, and SI units. Complete notes for Grade 9 FBISE Physics.',
          keywords: ['physical quantities', 'base quantities', 'SI units', 'derived quantities'],
          json_ld: {},
          canonical_url: 'https://studyvault.pk/grade-9/physics/physical-quantities-and-measurement/physical-quantities',
          og_image_url: 'https://studyvault.pk/og/physical-quantities.jpg',
          source_page: 5,
        },
        is_live: true,
        guest_preview_percent: 50,
        workflow_status: 'live',
        admin_notes: '',
        created_by: null,
        approved_by: null,
        approved_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('topics').insertMany(topicsChapter1);
    console.log(`✅ Created ${topicsChapter1.length} Topics for Chapter 1`);

    // Update chapter with topic IDs
    await db.collection('chapters').updateOne(
      { _id: chapters[0]._id },
      { 
        $set: { 
          topic_ids: topicsChapter1.map(t => t._id),
          total_topics: topicsChapter1.length,
        },
      }
    );

    // Update book counters
    const totalTopics = await db.collection('topics').countDocuments({ book_id: physicsBook._id });
    const totalChaptersCount = await db.collection('chapters').countDocuments({ book_id: physicsBook._id });
    
    await db.collection('books').updateOne(
      { _id: physicsBook._id },
      {
        $set: {
          total_topics: totalTopics,
          total_chapters: totalChaptersCount,
        },
      }
    );

    // ========== 6. Seed Demo Users ==========
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 12);

    const adminUser = {
      _id: new ObjectId(),
      name: 'Admin User',
      email: 'admin@studyvault.pk',
      password_hash: hashedPassword,
      avatar_url: null,
      role: 'admin',
      google_id: null,
      google_email: null,
      is_verified: true,
      otp: null,
      otp_expires_at: null,
      password_reset_token: null,
      password_reset_expires: null,
      student_profile: null,
      linked_children: [],
      parent_id: null,
      subscription: {
        plan: 'premium',
        status: 'active',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        ai_credits_used_today: 0,
        ai_credits_reset_at: new Date(),
      },
      active_session_token: null,
      active_device_fingerprint: null,
      teacher_profile: {
        assigned_book_ids: [physicsBook._id],
        assigned_program_ids: [programs[0]._id],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const studentUser = {
      _id: new ObjectId(),
      name: 'Ahmed Khan',
      email: 'student@example.com',
      password_hash: hashedPassword,
      avatar_url: null,
      role: 'student',
      google_id: null,
      google_email: null,
      is_verified: true,
      otp: null,
      otp_expires_at: null,
      password_reset_token: null,
      password_reset_expires: null,
      student_profile: {
        program_ids: [programs[0]._id],
        board_id: boards[0]._id,
        active_program_id: programs[0]._id,
        xp_total: 150,
        streak_days: 5,
        last_active: new Date(),
      },
      linked_children: [],
      parent_id: null,
      subscription: {
        plan: 'free',
        status: 'active',
        expires_at: null,
        ai_credits_used_today: 2,
        ai_credits_reset_at: new Date(),
      },
      active_session_token: null,
      active_device_fingerprint: null,
      teacher_profile: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').insertMany([adminUser, studentUser]);
    console.log(`✅ Created 2 Demo Users (admin@studyvault.pk / student@example.com)`);
    console.log('   Password for both: password123');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${boards.length} Boards`);
    console.log(`   • ${programs.length} Programs`);
    console.log(`   • 1 Book (Physics Grade 9)`);
    console.log(`   • ${chapters.length} Chapters`);
    console.log(`   • ${topicsChapter1.length} Topics`);
    console.log(`   • 2 Demo Users`);
    console.log('\n🚀 You can now login with:');
    console.log('   Admin: admin@studyvault.pk / password123');
    console.log('   Student: student@example.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
