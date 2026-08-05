-- Grading for Learning: add the one randomized controlled trial in this literature.
--
-- The template's evidence base was strong on accuracy/equity claims but carried no
-- causal evidence. Kramer et al. (2024) is the strongest available: a cluster RCT
-- across 29 Pennsylvania schools and 2,736 ninth graders, 0.33 SD on end-of-course
-- algebra and geometry assessments.
--
-- Deliberately NOT claimed here, because the source does not support it:
--   * "standardized" tests -- the outcome measures are described only as
--     end-of-course assessments; PA's Keystone covers Algebra I only, so the
--     geometry outcome cannot be the state accountability test.
--   * generic standards-based grading -- PARLO is a full package (proficiency
--     ratings on discrete outcomes, mandatory reassessment for full credit,
--     formative feedback, sustained funded PD). The result does not transfer to a
--     district that only changes its gradebook, which is why the existing
--     "not established for grading change on its own" caveat is kept and sharpened.
--   * uniform benefit -- the effect was moderated by student motivation, which is
--     an equity caution worth stating plainly rather than burying.

UPDATE initiative_templates
SET evidence_base =
'Grading reform is an accuracy and equity intervention, and the honest evidence matters. Marzano (2003) identifies a guaranteed and viable curriculum as the single highest-leverage school-level factor in achievement, which is why the system begins with team-identified Essential Standards. Standards-based grading is associated with more students reaching proficiency (Pollio and Hochbein, 2015) and with lower test anxiety (Lewis, 2022). The strongest causal evidence is a cluster randomized trial of the PARLO model in ninth grade mathematics across 29 Pennsylvania schools and 2,736 students, which found a 0.33 standard deviation effect on end-of-course algebra and geometry assessments (Kramer et al., 2024). Two caveats travel with that result. PARLO is a full package (proficiency ratings on discrete outcomes, mandatory reassessment for full credit, formative feedback, and sustained funded professional learning), not a gradebook change; and the effect was larger for students who arrived more motivated, which is the equity question to watch. Equitable grading reduces failing grades, with the largest decreases for low-income students and students of color (Feldman, 2019; Kappan, 2020), but the effect is not automatic: it emerges only when fidelity is high and grading reform is paired with instructional improvement (Guskey, 2022). The decisive caveat: no grading change improves learning on its own (Guskey and Link, 2022); it works only alongside coherent curriculum, strong instruction, meaningful feedback, and a culture that treats early failure as data rather than verdict. Supporting practices rest on O''Connor''s fixes (formative work carries no weight; most recent evidence replaces averaging), Guskey (2024) on separating mastery from behavior, Wormeli (2018) and Carey and Carifio (2012) on replacing early zeros with Not Yet, Hattie (2009) on feedback as a top instructional lever, and Chappuis (2015) on student self-assessment. Implementation is sequenced with established frameworks (Fixsen and the NIRN Active Implementation Frameworks; Hall and Hord''s CBAM), which warn that changing the gradebook display while still averaging mastery is paper implementation that produces no gains. References: Marzano (2003), What Works in Schools, ASCD. Ainsworth (2003), Power Standards, Lead and Learn Press. O''Connor (2018), How to Grade for Learning, Corwin. Kramer, Posner, Browman, Lawrence, Roem and Krier (2024), Journal of Research on Educational Effectiveness, doi:10.1080/19345747.2023.2287594. Guskey (2022), Theory Into Practice 61(4); Guskey and Link (2022). Feldman (2019, 2nd ed. 2024), Grading for Equity, Corwin. Wormeli (2018), Fair Isn''t Always Equal, 2nd ed., Stenhouse. Hattie (2009), Visible Learning, Routledge. Chappuis (2015), Seven Strategies of Assessment for Learning, Pearson. Fixsen et al. (2005), Active Implementation Frameworks, NIRN; Hall and Hord (2015), Implementing Change. Evidence level: Moderate. One randomized trial supports achievement gains from a full proficiency-based package; achievement effects are not established for a gradebook change on its own.'
WHERE id = '01873ad0-1443-4ec3-a0c1-12e98ac3f93d';
