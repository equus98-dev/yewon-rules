import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const rule = await prisma.rule.findFirst({ where: { ruleNumber: '1-0-2' } });
    if (!rule) return;
    const revs = await prisma.revision.findMany({
        where: { ruleId: rule.id },
        orderBy: { enactmentDate: 'desc' }
    });
    if (revs.length > 1) {
        // Delete the latest one
        const latest = revs[0];
        console.log("Deleting latest revision:", latest.versionName);
        await prisma.article.deleteMany({ where: { revisionId: latest.id } });
        await prisma.revision.delete({ where: { id: latest.id } });
        console.log("Deleted!");
    } else {
        console.log("Only one revision found, not deleting.");
    }
}
main().finally(() => prisma.$disconnect());
