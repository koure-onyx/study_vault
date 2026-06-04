import Board from '@studyvault/db/models/Board.js';
import Program from '@studyvault/db/models/Program.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(text = '') {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function quranBookFilter() {
  return {
    $or: [
      { slug: 'the-holy-quran' },
      { subject_slug: 'the-holy-quran' },
      { title: /quran/i },
      { subject: /quran/i },
    ],
  };
}

export async function resolveUserContentProfile(user) {
  const boardName = user?.board || user?.student_profile?.board;
  const gradeName = user?.grade || user?.student_profile?.grade;
  let boardId = user?.student_profile?.board_id || null;
  let programId = user?.student_profile?.active_program_id || null;

  if (!boardId && boardName) {
    const boardDoc = await Board.findOne({
      $or: [
        { name: boardName },
        { name: new RegExp(`^${escapeRegex(boardName)}$`, 'i') },
        { short_code: boardName },
        { name: new RegExp(escapeRegex(boardName.split(' ').slice(-1)[0] || boardName), 'i') },
      ],
    })
      .select('_id name')
      .lean();
    boardId = boardDoc?._id || null;
  }

  if (!programId && gradeName) {
    const gradeCore = gradeName.split('(')[0].trim();
    const programDoc = await Program.findOne({
      $or: [
        { name: gradeName },
        { name: gradeCore },
        { slug: slugify(gradeName) },
        { slug: slugify(gradeCore) },
        { name: new RegExp(`^${escapeRegex(gradeCore)}$`, 'i') },
      ],
    })
      .select('_id name slug')
      .lean();
    programId = programDoc?._id || null;
  }

  return { boardId, programId, boardName, gradeName };
}

export function buildBookFilter({ boardId, programId, boardName, gradeName }) {
  const scopeParts = [{ is_current_edition: { $ne: false } }];

  if (boardId) {
    scopeParts.push({ board_id: boardId });
  }

  if (programId) {
    scopeParts.push({ program_id: programId });
  } else if (gradeName) {
    const gradeCore = gradeName.split('(')[0].trim();
    scopeParts.push({
      $or: [
        { grade: gradeName },
        { 'metadata.grade': gradeName },
        { 'metadata.grade_level': gradeName },
        { 'metadata.grade_level': new RegExp(`^${escapeRegex(gradeCore)}$`, 'i') },
        { title: new RegExp(escapeRegex(gradeCore), 'i') },
      ],
    });
  }

  if (scopeParts.length === 1) {
    return { is_current_edition: { $ne: false } };
  }

  return {
    $or: [quranBookFilter(), { $and: scopeParts }],
  };
}
