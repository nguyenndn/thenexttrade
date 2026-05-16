const fs = require('fs');
const files = [
  'src/app/dashboard/leaderboard/page.tsx',
  'src/app/dashboard/leaderboard/actions.ts',
  'src/app/dashboard/leaderboard/components/LeaderboardTabs.tsx',
  'src/app/dashboard/leaderboard/components/LeaderboardContent.tsx',
  'src/app/dashboard/leaderboard/components/LeaderboardTable.tsx',
  'src/app/dashboard/leaderboard/components/LeaderboardRow.tsx',
  'src/app/dashboard/leaderboard/components/TopPodium.tsx',
  'src/app/dashboard/leaderboard/components/MyRankCard.tsx',
  'src/app/dashboard/leaderboard/components/MyStatsView.tsx',
  'src/app/dashboard/leaderboard/components/RankUpModal.tsx',
  'src/app/dashboard/leaderboard/components/UserProfileCard.tsx',
  'src/components/layout/UserMenu.tsx',
  'src/components/dashboard/LeaderboardWidget.tsx',
  'src/components/academy/PublicLessonView.tsx',
  'src/components/academy/LessonLockedView.tsx',
  'src/app/api/streak/check-in/route.ts',
  'src/app/dashboard/settings/streak/StreakClient.tsx',
  'src/app/admin/users/[id]/page.tsx'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    let newContent = content;
    
    newContent = newContent.replace(/XP Rankings/g, 'Edge Ranking');
    newContent = newContent.replace(/Total XP/g, 'Edge Score');
    newContent = newContent.replace(/XP Earned/g, 'Edge Earned');
    newContent = newContent.replace(/Tier Progress/g, 'Edge Progress');
    newContent = newContent.replace(/Start earning XP/g, 'Start earning Edge');
    newContent = newContent.replace(/XP to next tier/g, 'Edge to next rank');
    newContent = newContent.replace(/XP to next rank/g, 'Edge to next rank');
    newContent = newContent.replace(/XP to/g, 'Edge to');
    newContent = newContent.replace(/earn XP/g, 'earn Edge');
    newContent = newContent.replace(/XP rewards/g, 'Edge rewards');
    newContent = newContent.replace(/([0-9]+\s*)XP\b/g, '$1Edge');
    newContent = newContent.replace(/\{userXp\.toLocaleString\(\)\}\s*XP/g, '{userXp.toLocaleString()} Edge');
    newContent = newContent.replace(/\{user\.xp\.toLocaleString\(\)\}\s*XP/g, '{user.xp.toLocaleString()} Edge');
    newContent = newContent.replace(/\{myEntry\.xp\.toLocaleString\(\)\}\s*XP/g, '{myEntry.xp.toLocaleString()} Edge');
    newContent = newContent.replace(/\{entry\.xp\.toLocaleString\(\)\}\s*XP/g, '{entry.xp.toLocaleString()} Edge');
    newContent = newContent.replace(/\{xp\.toLocaleString\(\)\}\s*XP/g, '{xp.toLocaleString()} Edge');
    newContent = newContent.replace(/XP Ranking/g, 'Edge Ranking');
    newContent = newContent.replace(/XP Earned!/g, 'Edge Earned!');
    newContent = newContent.replace(/>XP</g, '>Edge<');
    newContent = newContent.replace(/'XP'/g, "'Edge'");
    newContent = newContent.replace(/\"XP\"/g, '"Edge"');
    newContent = newContent.replace(/\+ \d+ XP/g, match => match.replace('XP', 'Edge'));
    newContent = newContent.replace(/\+\{?[^}]+\}?\s*XP/g, match => match.replace('XP', 'Edge'));

    if (content !== newContent) {
      fs.writeFileSync(f, newContent);
      console.log('Updated ' + f);
    }
  }
}
