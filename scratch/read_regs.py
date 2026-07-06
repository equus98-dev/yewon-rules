import sqlite3
import os

db_path = 'f:\\예원예술대학교_규정관리시스템\\dev.db'
if not os.path.exists(db_path):
    print("Database not found")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT R.title, A.articleNumber, A.title, A.contentText FROM Rule R JOIN Revision RV ON R.id = RV.ruleId JOIN Article A ON RV.id = A.revisionId WHERE R.title LIKE '%직제 규정%' OR R.title LIKE '%사무분장 규정%' ORDER BY R.title, A.articleNumber")
        rows = cursor.fetchall()
        
        with open('f:\\예원예술대학교_규정관리시스템\\regs_output.txt', 'w', encoding='utf-8') as f:
            for r in rows:
                f.write(f"[{r[0]}] 제{r[1]}조({r[2]})\n{r[3]}\n\n")
        
        print("Done")
    except Exception as e:
        print("Error:", e)
    finally:
        if 'conn' in locals():
            conn.close()
