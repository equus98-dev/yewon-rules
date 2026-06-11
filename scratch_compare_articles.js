const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const rules = await prisma.rule.findMany({
        where: {
            title: {
                in: ['학교법인 예원예술대학교 정관', '학교법인 예원예술대학교 정관 시행규정']
            }
        },
        include: {
            revisions: {
                orderBy: { enactmentDate: 'desc' },
                take: 1,
                include: {
                    articles: {
                        where: {
                            articleNumber: { in: [1, 2] }
                        },
                        orderBy: { articleNumber: 'asc' }
                    }
                }
            }
        }
    });

    for (const rule of rules) {
        console.log(`\n=== Rule: ${rule.title} ===`);
        const rev = rule.revisions[0];
        if (!rev) continue;
        for (const art of rev.articles) {
            console.log(`\nArticle ${art.articleNumber} JSON:`);
            console.log(JSON.stringify(art.contentJson, null, 2));
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
