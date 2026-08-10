export function visibleFoodWallPosts(posts, cohortId) {
  return posts
    .filter((post) => post.cohortId === cohortId && post.visibility === "cohort")
    .map(({ id, mealType, proteinRange }) => ({ id, mealType, proteinRange }));
}

export function buildLeaderboard(members) {
  const sorted = members
    .filter((member) => member.optedIn)
    .map((member) => ({ member: member.member, points: Math.min(member.completeDays, 7) }))
    .sort((first, second) => second.points - first.points || first.member.localeCompare(second.member));

  let previousPoints = null;
  let rank = 0;

  return sorted.map((entry, index) => {
    if (entry.points !== previousPoints) rank = index + 1;
    previousPoints = entry.points;
    return { ...entry, rank };
  });
}
