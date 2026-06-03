UPDATE "exercises"
SET "target_muscle_groups" = CASE
  WHEN "body_part" = 'other' THEN ARRAY[]::text[]

  WHEN "body_part" = 'chest' AND "name" IN ('ベンチプレス', 'ダンベルプレス', 'チェストプレス') THEN ARRAY['chest_overall', 'arms_triceps']::text[]
  WHEN "body_part" = 'chest' AND "name" IN ('インクラインダンベルプレス', 'インクラインベンチプレス') THEN ARRAY['chest_upper', 'arms_triceps']::text[]
  WHEN "body_part" = 'chest' AND "name" IN ('デクラインプレス', 'デクラインベンチプレス', 'ディップス') THEN ARRAY['chest_lower', 'arms_triceps']::text[]
  WHEN "body_part" = 'chest' AND "name" = 'プッシュアップ' THEN ARRAY['chest_outer', 'arms_triceps']::text[]

  WHEN "body_part" = 'back' AND "name" IN ('デッドリフト', 'ハイパーエクステンション') THEN ARRAY['back_erectors', 'legs_glutes', 'legs_hamstrings']::text[]
  WHEN "body_part" = 'back' AND "name" IN ('懸垂', 'ラットプルダウン', 'リバースグリップラットプルダウン', 'ワイドグリップチンニング') THEN ARRAY['back_width', 'arms_biceps']::text[]
  WHEN "body_part" = 'back' AND "name" IN ('バーベルローイング', 'シーテッドロー', 'ワンハンドローイング', 'T バーローイング', 'ケーブルローイング') THEN ARRAY['back_thickness', 'arms_biceps']::text[]
  WHEN "body_part" = 'back' AND "name" = 'シュラッグ' THEN ARRAY['back_traps']::text[]
  WHEN "body_part" = 'back' AND "name" = 'フェイスプル' THEN ARRAY['back_traps', 'shoulders_rear']::text[]

  WHEN "body_part" = 'legs' AND "name" IN ('スクワット', 'レッグプレス', 'ブルガリアンスクワット', 'スプリットスクワット', 'ランジ', 'ステップアップ') THEN ARRAY['legs_quads', 'legs_glutes']::text[]
  WHEN "body_part" = 'legs' AND "name" = 'ルーマニアンデッドリフト' THEN ARRAY['legs_hamstrings', 'legs_glutes', 'back_erectors']::text[]
  WHEN "body_part" = 'legs' AND "name" = 'ヒップスラスト' THEN ARRAY['legs_glutes', 'legs_hamstrings']::text[]

  WHEN "body_part" = 'shoulders' AND "name" IN ('ダンベルショルダープレス', 'ショルダープレス', 'ミリタリープレス', 'アーノルドプレス') THEN ARRAY['shoulders_overall', 'arms_triceps']::text[]
  WHEN "body_part" = 'shoulders' AND "name" = 'フェイスプル' THEN ARRAY['shoulders_rear', 'back_traps']::text[]

  WHEN "body_part" = 'arms' AND "name" IN ('ダンベルハンマーカール', 'リバースカール') THEN ARRAY['arms_biceps', 'arms_forearms']::text[]
  WHEN "body_part" = 'arms' AND "name" IN ('ナローベンチプレス', 'クローズグリッププッシュアップ') THEN ARRAY['arms_triceps', 'chest_overall']::text[]

  WHEN "body_part" = 'core' AND "name" IN ('レッグレイズ', 'ハンギングレッグレイズ', 'マウンテンクライマー') THEN ARRAY['core_rectus', 'core_hip_flexors']::text[]
  WHEN "body_part" = 'core' AND "name" IN ('プランク', 'アブローラー') THEN ARRAY['core_transverse', 'core_rectus']::text[]

  WHEN "muscle_sub_group" IS NOT NULL THEN ARRAY["muscle_sub_group"]::text[]
  ELSE NULL
END
WHERE "user_id" IS NULL;
