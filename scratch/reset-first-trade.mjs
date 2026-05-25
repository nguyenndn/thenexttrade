import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function reset() {
  const records = await prisma.userMissionProgress.findMany({
    where: { missionId: 'FIRST_JOURNAL' },
    include: { user: { select: { email: true, xp: true } } }
  });

  console.log('Found records:', records.length);
  for (const r of records) {
    console.log('  User:', r.user.email, '| Claimed:', r.claimed, '| XP:', r.user.xp);
  }

  if (records.length === 0) {
    console.log('No FIRST_JOURNAL mission records found.');
    await prisma.$disconnect();
    return;
  }

  for (const r of records) {
    await prisma.userMissionProgress.delete({ where: { id: r.id } });
    console.log('Deleted mission progress for user:', r.user.email);

    if (r.claimed) {
      await prisma.user.update({
        where: { id: r.userId },
        data: { xp: { decrement: 50 } }
      });
      console.log('  Subtracted 50 XP');
    }

    const deleted = await prisma.edgeEvent.deleteMany({
      where: { userId: r.userId, eventType: 'MISSION_CLAIM_FIRST_JOURNAL' }
    });
    console.log('  Deleted', deleted.count, 'claim events');
  }

  console.log('Done! FIRST_JOURNAL mission has been reset.');
  await prisma.$disconnect();
}

reset().catch(e => { console.error(e); process.exit(1); });
