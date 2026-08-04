export function createBoard(input = {}) {
  return {
    id: input.id ?? "",
    name: input.name ?? "",
    ownerId: input.ownerId ?? "",
    createdBy: input.createdBy ?? "",
    members: Array.isArray(input.members) ? input.members : [],
    createdAt: input.createdAt ?? null,
    ...input,
  };
}

export function isBoardMember(board, uid) {
  return Boolean(board && Array.isArray(board.members) && uid && board.members.includes(uid));
}
