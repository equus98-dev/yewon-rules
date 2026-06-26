DELETE FROM Article WHERE revisionId = '58ec6a1d-43b3-4131-a65a-12a2d5de73cf' AND articleNumber >= 8000;

INSERT INTO Article (id, revisionId, chapter, articleNumber, title, contentText, contentHtml, contentJson, createdAt, updatedAt)
VALUES 
('addendum-3-1-21-1', '58ec6a1d-43b3-4131-a65a-12a2d5de73cf', '부칙', 8000, '부칙 (신설 2023.10.05)', '부칙 (신설 2023.10.05)\n1. (시행일) 이 규정은 2023년 10월 5일부터 시행한다.', '<p>부칙 (신설 2023.10.05)</p><p>1. (시행일) 이 규정은 2023년 10월 5일부터 시행한다.</p>', '[{"num":"부칙(신설 2023.10.05)","text":"1. (시행일) 이 규정은 2023년 10월 5일부터 시행한다.","type":"article"}]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('addendum-3-1-21-2', '58ec6a1d-43b3-4131-a65a-12a2d5de73cf', '부칙', 8001, '부칙 (신설 2024.01.11)', '부칙 (신설 2024.01.11)\n1. (시행일) 이 규정은 2024년 1월 11일부터 시행한다.', '<p>부칙 (신설 2024.01.11)</p><p>1. (시행일) 이 규정은 2024년 1월 11일부터 시행한다.</p>', '[{"num":"부칙(신설 2024.01.11)","text":"1. (시행일) 이 규정은 2024년 1월 11일부터 시행한다.","type":"article"}]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
