CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`from_status` text,
	`to_status` text,
	`actor_id` text NOT NULL,
	`actor_role` text NOT NULL,
	`note` text,
	`metadata_json` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_created` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_actor` ON `audit_logs` (`actor_id`);--> statement-breakpoint
CREATE TABLE `claims` (
	`id` text PRIMARY KEY NOT NULL,
	`no_sep` text NOT NULL,
	`patient_alias` text NOT NULL,
	`patient_card_hash` text NOT NULL,
	`patient_nik_masked` text NOT NULL,
	`patient_gender` text NOT NULL,
	`patient_age` integer NOT NULL,
	`admission_date` text NOT NULL,
	`discharge_date` text NOT NULL,
	`los_days` integer NOT NULL,
	`service_type` text NOT NULL,
	`care_class` integer NOT NULL,
	`hospital_id` text NOT NULL,
	`referring_facility` text NOT NULL,
	`doctor_id` text NOT NULL,
	`icd10_primary` text NOT NULL,
	`icd10_secondary_json` text DEFAULT '[]' NOT NULL,
	`icd9_procedures_json` text DEFAULT '[]' NOT NULL,
	`inacbg_code` text NOT NULL,
	`inacbg_description` text NOT NULL,
	`tariff_idr` integer NOT NULL,
	`peer_avg_tariff_idr` integer NOT NULL,
	`hospital_real_cost_idr` integer NOT NULL,
	`score_medical` integer NOT NULL,
	`score_statistical` integer NOT NULL,
	`score_network` integer NOT NULL,
	`risk_score` integer NOT NULL,
	`risk_zone` text NOT NULL,
	`fraud_typology` text DEFAULT 'none' NOT NULL,
	`signal_summary` text NOT NULL,
	`evidence_json` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'belum_dicek' NOT NULL,
	`sla_due_at` text NOT NULL,
	`clarification_requested_at` text,
	`hospital_response_note` text,
	`hospital_responded_at` text,
	`ai_narrative_cache` text,
	`ai_draft_cache` text,
	`escalated_to_pkjkn` integer DEFAULT false NOT NULL,
	`verified_by` text,
	`verified_at` integer,
	`decision_note` text,
	`revised_tariff_idr` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `claims_no_sep_unique` ON `claims` (`no_sep`);--> statement-breakpoint
CREATE INDEX `idx_claims_status_score` ON `claims` (`status`,`risk_score`);--> statement-breakpoint
CREATE INDEX `idx_claims_hospital_status` ON `claims` (`hospital_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_claims_doctor_status` ON `claims` (`doctor_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_claims_zone` ON `claims` (`risk_zone`);--> statement-breakpoint
CREATE INDEX `idx_claims_typology` ON `claims` (`fraud_typology`);--> statement-breakpoint
CREATE INDEX `idx_claims_sla` ON `claims` (`sla_due_at`);--> statement-breakpoint
CREATE TABLE `doctors` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`specialty` text NOT NULL,
	`primary_hospital_id` text NOT NULL,
	`practice_facility_count` integer DEFAULT 1 NOT NULL,
	`repeat_procedure_ratio_pct` real DEFAULT 0 NOT NULL,
	`peer_avg_ratio_pct` real DEFAULT 6 NOT NULL,
	`consecutive_rejections` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`primary_hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doctors_code_unique` ON `doctors` (`code`);--> statement-breakpoint
CREATE INDEX `idx_doctors_hospital` ON `doctors` (`primary_hospital_id`);--> statement-breakpoint
CREATE TABLE `fraud_clusters` (
	`id` text PRIMARY KEY NOT NULL,
	`cluster_code` text NOT NULL,
	`title` text NOT NULL,
	`branch_code` text NOT NULL,
	`primary_hospital_id` text NOT NULL,
	`central_doctor_id` text,
	`risk_score` integer NOT NULL,
	`priority_level` text NOT NULL,
	`fraud_typology` text NOT NULL,
	`trigger_reason` text NOT NULL,
	`escalated_claim_count` integer DEFAULT 0 NOT NULL,
	`potential_loss_idr` integer DEFAULT 0 NOT NULL,
	`agreed_tgr_idr` integer DEFAULT 0 NOT NULL,
	`graph_payload_json` text DEFAULT '{}' NOT NULL,
	`followup_stage` text DEFAULT 'baru' NOT NULL,
	`final_status` text DEFAULT 'belum_final' NOT NULL,
	`field_checklist_json` text DEFAULT '{}' NOT NULL,
	`audit_result_note` text,
	`assigned_auditor_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`primary_hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`central_doctor_id`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_auditor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fraud_clusters_cluster_code_unique` ON `fraud_clusters` (`cluster_code`);--> statement-breakpoint
CREATE INDEX `idx_clusters_branch_priority` ON `fraud_clusters` (`branch_code`,`priority_level`);--> statement-breakpoint
CREATE INDEX `idx_clusters_hospital` ON `fraud_clusters` (`primary_hospital_id`);--> statement-breakpoint
CREATE INDEX `idx_clusters_stage` ON `fraud_clusters` (`followup_stage`);--> statement-breakpoint
CREATE TABLE `hospitals` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`facility_type` text NOT NULL,
	`branch_code` text NOT NULL,
	`director_name` text NOT NULL,
	`bed_capacity` integer NOT NULL,
	`bor_total_pct` real DEFAULT 0 NOT NULL,
	`bor_cardio_vip_pct` real DEFAULT 0 NOT NULL,
	`compliance_score` integer DEFAULT 100 NOT NULL,
	`compliance_grade` text NOT NULL,
	`pilar_bor_score` integer DEFAULT 100 NOT NULL,
	`pilar_coding_score` integer DEFAULT 100 NOT NULL,
	`pilar_fast_track_pct` real DEFAULT 100 NOT NULL,
	`pilar_response_score` integer DEFAULT 100 NOT NULL,
	`tgr_burden_idr` integer DEFAULT 0 NOT NULL,
	`pks_expires_at` text NOT NULL,
	`pks_status` text DEFAULT 'aktif' NOT NULL,
	`pks_eoffice_number` text,
	`dominant_typology` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hospitals_code_unique` ON `hospitals` (`code`);--> statement-breakpoint
CREATE INDEX `idx_hospitals_branch` ON `hospitals` (`branch_code`);--> statement-breakpoint
CREATE INDEX `idx_hospitals_pks_status` ON `hospitals` (`pks_status`);--> statement-breakpoint
CREATE INDEX `idx_hospitals_compliance_score` ON `hospitals` (`compliance_score`);--> statement-breakpoint
CREATE TABLE `media_files` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`uploaded_by` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_files_object_key_unique` ON `media_files` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_media_uploaded_by` ON `media_files` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `idx_media_entity` ON `media_files` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `pks_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`hospital_id` text NOT NULL,
	`cluster_id` text,
	`evaluation_period` text NOT NULL,
	`recommended_policy` text NOT NULL,
	`final_policy` text,
	`tgr_commitment_idr` integer DEFAULT 0 NOT NULL,
	`addendum_requirements_json` text DEFAULT '[]' NOT NULL,
	`meeting_checklist_json` text DEFAULT '{}' NOT NULL,
	`eoffice_ref_number` text,
	`executive_note` text,
	`draft_letter_cache` text,
	`is_locked` integer DEFAULT false NOT NULL,
	`decided_by` text,
	`decided_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cluster_id`) REFERENCES `fraud_clusters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_pks_hospital` ON `pks_decisions` (`hospital_id`);--> statement-breakpoint
CREATE INDEX `idx_pks_locked` ON `pks_decisions` (`is_locked`);--> statement-breakpoint
CREATE TABLE `storage_usage` (
	`month` text PRIMARY KEY NOT NULL,
	`class_a` integer DEFAULT 0 NOT NULL,
	`class_b` integer DEFAULT 0 NOT NULL,
	`total_bytes` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`unit_name` text NOT NULL,
	`branch_code` text NOT NULL,
	`title` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);