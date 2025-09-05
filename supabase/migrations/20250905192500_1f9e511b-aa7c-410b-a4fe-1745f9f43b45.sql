-- Create comprehensive solar sales training courses with modules

-- Insert main courses
INSERT INTO public.courses (title, description, category, level, duration, status, instructor_id) VALUES 
('Building A Pro Mindset', 'Develop the foundational mindset and attitudes required for professional solar sales success', 'Sales Training', 'beginner', '2-3 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Understanding Your Role', 'Learn the core responsibilities and daily structure of a successful solar sales professional', 'Sales Training', 'beginner', '1-2 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Area Management & Prospecting', 'Master territory management and effective prospecting strategies for solar sales', 'Sales Training', 'intermediate', '2-3 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Sales Process Fundamentals', 'Core principles of effective sales communication and presentation skills', 'Sales Training', 'beginner', '2 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Intro To Door Presentation', 'Complete guide to effective door-to-door solar sales presentations', 'Sales Training', 'intermediate', '3-4 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)),
('D2D Techniques', 'Advanced door-to-door sales techniques and psychological strategies', 'Sales Training', 'advanced', '2-3 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Intro Handling Objections/Concerns', 'Comprehensive objection handling strategies and response frameworks', 'Sales Training', 'intermediate', '3-4 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Appointment Expectations', 'Setting proper expectations and ensuring successful appointment outcomes', 'Sales Training', 'intermediate', '2-3 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Question Based Selling', 'Master the art of question-based selling techniques for solar sales', 'Sales Training', 'intermediate', '2 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Creating The Pain', 'Identify and articulate customer pain points to drive solar adoption', 'Sales Training', 'intermediate', '2 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Full Door Presentation', 'Complete door presentation practice and implementation', 'Sales Training', 'advanced', '1-2 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Staying Mentally Locked In', 'Mental resilience and motivation strategies for sustained sales success', 'Sales Training', 'beginner', '1-2 hours', 'published', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1));

-- Insert modules for Building A Pro Mindset
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 15, 'video'
FROM (VALUES 
  ('Building A Pro Mindset', 'Path To Pro', 1),
  ('Building A Pro Mindset', 'What Is A Salesperson', 2),
  ('Building A Pro Mindset', 'Mindset', 3),
  ('Building A Pro Mindset', 'Empathy', 4),
  ('Building A Pro Mindset', 'Understanding Your Why', 5),
  ('Building A Pro Mindset', 'Finding Your Who', 6),
  ('Building A Pro Mindset', 'Defining Success', 7),
  ('Building A Pro Mindset', 'Potential + Training – Interference = High Performance', 8)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;

-- Insert modules for Understanding Your Role
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 20, 'video'
FROM (VALUES 
  ('Understanding Your Role', 'Responsibilities Of A Setter', 1),
  ('Understanding Your Role', 'Building Your Day', 2),
  ('Understanding Your Role', 'History of Solar', 3)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;

-- Insert modules for Area Management & Prospecting
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 25, 'video'
FROM (VALUES 
  ('Area Management & Prospecting', 'Volt Tutorial Video', 1),
  ('Area Management & Prospecting', 'Becoming The Mayor (Story/Tactics)', 2),
  ('Area Management & Prospecting', 'Spend More Time with Better Prospects', 3),
  ('Area Management & Prospecting', 'Area Management (quadrants/finding hot spots)', 4),
  ('Area Management & Prospecting', 'Capitalizing on Saturdays', 5)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;

-- Insert modules for Sales Process Fundamentals
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 20, 'video'
FROM (VALUES 
  ('Sales Process Fundamentals', 'Clarity/Repition/Energy/Belief/Service', 1),
  ('Sales Process Fundamentals', 'Body Language/Tonality', 2),
  ('Sales Process Fundamentals', 'Making A Great First Impression', 3),
  ('Sales Process Fundamentals', 'Tonality Exercise IDNSHSTM', 4)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;

-- Insert modules for Intro To Door Presentation
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 25, 'video'
FROM (VALUES 
  ('Intro To Door Presentation', 'Before The Doors', 1),
  ('Intro To Door Presentation', 'Steps Of The Sale', 2),
  ('Intro To Door Presentation', 'Who You Are', 3),
  ('Intro To Door Presentation', 'Why You''re There', 4),
  ('Intro To Door Presentation', 'Storytelling', 5),
  ('Intro To Door Presentation', 'Creating The Pain', 6),
  ('Intro To Door Presentation', 'Making It Make Sense', 7),
  ('Intro To Door Presentation', 'Setting The Appointment', 8)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;

-- Insert modules for D2D Techniques
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 20, 'video'
FROM (VALUES 
  ('D2D Techniques', 'Reverse Selling', 1),
  ('D2D Techniques', 'Pulling Back/Take Aways', 2),
  ('D2D Techniques', 'Assuming The Sale', 3),
  ('D2D Techniques', 'Effective Bandwagon', 4),
  ('D2D Techniques', 'Specific Take Aways', 5),
  ('D2D Techniques', 'Problem Vs Consequence', 6),
  ('D2D Techniques', 'Assumptive Scheduling', 7)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;

-- Insert modules for Intro Handling Objections/Concerns
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 20, 'video'
FROM (VALUES 
  ('Intro Handling Objections/Concerns', 'Objections are the Objective', 1),
  ('Intro Handling Objections/Concerns', 'Identifying Objections', 2),
  ('Intro Handling Objections/Concerns', 'Credibility/Value/Urgency', 3),
  ('Intro Handling Objections/Concerns', 'Psychology Of No', 4),
  ('Intro Handling Objections/Concerns', 'The 4 What Ifs', 5),
  ('Intro Handling Objections/Concerns', 'Not Interested', 6),
  ('Intro Handling Objections/Concerns', 'Bill isnt that bad', 7),
  ('Intro Handling Objections/Concerns', 'Already Looked Into It', 8),
  ('Intro Handling Objections/Concerns', 'Agree/Assume/Overcome', 9),
  ('Intro Handling Objections/Concerns', 'Recognizing Patterns in an area', 10),
  ('Intro Handling Objections/Concerns', 'Dont have all the answers', 11)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;

-- Insert modules for Appointment Expectations
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 20, 'video'
FROM (VALUES 
  ('Appointment Expectations', 'Creating Sticky Appts (Framing)', 1),
  ('Appointment Expectations', 'Closer Will Come Inside', 2),
  ('Appointment Expectations', 'Both Spouses Present', 3),
  ('Appointment Expectations', 'One-Hour Arrival Window', 4),
  ('Appointment Expectations', 'Customer Will Be Taking Action (Submitting an Application)', 5),
  ('Appointment Expectations', 'Collect FULL Utility Bill', 6),
  ('Appointment Expectations', 'Same-Day Confirmation', 7),
  ('Appointment Expectations', 'Confirm Credit Requirement', 8),
  ('Appointment Expectations', 'Sell The Install', 9)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;

-- Insert modules for Question Based Selling
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 20, 'video'
FROM (VALUES 
  ('Question Based Selling', 'Question Based Selling', 1),
  ('Question Based Selling', 'Why We Ask Questions', 2),
  ('Question Based Selling', 'How to Effective Questioning', 3),
  ('Question Based Selling', 'Open Questions (change one thing about)', 4),
  ('Question Based Selling', 'Closed Questions', 5),
  ('Question Based Selling', 'Alternate of choice', 6),
  ('Question Based Selling', 'Tie Down', 7)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;

-- Insert modules for Creating The Pain
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 25, 'video'
FROM (VALUES 
  ('Creating The Pain', 'Building The Problem', 1),
  ('Creating The Pain', 'Emotional Appeal', 2),
  ('Creating The Pain', 'How to Read and Break Down a Utility Bill', 3),
  ('Creating The Pain', 'Going on a Safari', 4),
  ('Creating The Pain', 'Getting Usage/info', 5),
  ('Creating The Pain', 'Kill The Bill', 6)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;

-- Insert modules for Full Door Presentation
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 30, 'video'
FROM (VALUES 
  ('Full Door Presentation', 'Mock Door Presentation', 1),
  ('Full Door Presentation', 'Door Presentation', 2),
  ('Full Door Presentation', 'Door Presentation', 3)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;

-- Insert modules for Staying Mentally Locked In
INSERT INTO public.modules (course_id, title, description, order_index, duration_minutes, content_type) 
SELECT c.id, module_title, 'Video training module', module_order, 15, 'video'
FROM (VALUES 
  ('Staying Mentally Locked In', 'Maintaining A PMA', 1),
  ('Staying Mentally Locked In', 'Losing Is Not An Option', 2),
  ('Staying Mentally Locked In', 'Don''t Do The Math', 3),
  ('Staying Mentally Locked In', 'Choose Your Hard', 4),
  ('Staying Mentally Locked In', 'Stay In The Middle', 5),
  ('Staying Mentally Locked In', 'Perpetual Journey Of A Salesman', 6)
) AS modules(course_title, module_title, module_order)
JOIN courses c ON c.title = modules.course_title;