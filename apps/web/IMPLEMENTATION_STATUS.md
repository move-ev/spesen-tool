# Presigned URL Upload System - Implementation Status

## ✅ Phase 1: Foundation - COMPLETED

### Database Schema
- ✅ Updated Prisma schema with new Attachment fields:
  - `originalName`, `contentType`, `size` (file metadata)
  - `visibility` (PRIVATE/PUBLIC), `status` (PENDING/UPLOADED/FAILED/DELETED)
  - `uploadedById`, `uploadedBy` (audit trail)
  - `deletedAt`, `deletedById`, `deletedBy` (soft delete)
  - `organizationId` (for org-level files)
- ✅ Added enums: `FileVisibility`, `FileStatus`
- ✅ Updated User model with attachment relations
- ✅ Updated Organization model with attachments relation
- ✅ Created and applied migration: `20260201144721_add_attachment_metadata`
- ✅ Regenerated Prisma Client

### Storage Utilities
- ✅ Created `/src/server/storage/validation.ts`
  - File size validation (5MB max)
  - MIME type validation (PDF, images)
  - Extension blocklist (executables)

- ✅ Created `/src/server/storage/keys.ts`
  - `generateFileHash()` - SHA-256 hash for unique filenames
  - `getFileExtension()` - Extract file extension
  - `generateAttachmentKey()` - Generate S3 keys with structure:
    - `attachments/private/{orgId}/{reportId}/{hash}.{ext}` for receipts
    - `attachments/public/{orgId}/logo/{hash}.{ext}` for org logos

- ✅ Created `/src/server/storage/presigned.ts`
  - `generatePresignedUploadUrl()` - 5-minute upload URLs
  - `generatePresignedDownloadUrl()` - 1-hour download URLs

- ✅ Updated `/src/server/storage/s3-client.ts`
  - Exported `getS3Client()` function
  - Added `verifyFileInS3()` - Check file existence
  - Added `deleteFileFromS3()` - Delete files (for future use)

### API Implementation
- ✅ Created `/src/server/api/routers/attachment.ts` with 5 procedures:
  1. **`requestUploadUrl`** - Generate presigned URL and create PENDING record
     - Validates file metadata and user permissions
     - Checks report ownership and status
     - Creates attachment record in PENDING state

  2. **`confirmUpload`** - Verify upload and mark as UPLOADED
     - Verifies file exists in S3 via HeadObject
     - Updates status to UPLOADED

  3. **`getDownloadUrl`** - Get presigned download URL
     - Permission checks based on visibility
     - Only UPLOADED and non-deleted files

  4. **`delete`** - Soft delete attachment
     - Checks ownership and report status
     - Only draft/needs-revision reports

  5. **`listForExpense`** - List attachments for an expense
     - Returns only UPLOADED, non-deleted files

- ✅ Added attachment router to `/src/server/api/root.ts`

### Expense Router Updates
- ✅ Updated `/src/lib/validators.ts`
  - Changed `objectKeys` to `attachmentIds` in `createReceiptExpenseSchema`

- ✅ Updated `/src/server/api/routers/expense.ts`
  - Modified `createReceipt` mutation:
    - Validates attachments exist, are owned by user, and are UPLOADED
    - Links attachments to expense in transaction
    - Sets `expenseId` on attachment records

## ✅ Phase 2: Client Integration - COMPLETED

### Client Hook
- ✅ Created `/src/hooks/use-presigned-upload.ts`
  - `uploadFile()` - Upload single file with 3-step process
  - `uploadFiles()` - Upload multiple files in parallel
  - Progress tracking with status states
  - Error handling with toast notifications

### UI Components
- ✅ Updated `/src/components/forms/expense/receipt.tsx`
  - Removed `@better-upload/client` dependency
  - Integrated `usePresignedUpload` hook
  - Changed form field from `objectKeys` to `attachmentIds`
  - Upload files before creating expense

- ✅ Updated `/packages/ui/src/components/upload-dropzone.tsx`
  - Made `control` prop optional (no longer requires better-upload)
  - Works with standalone `uploadOverride` callback

### Dependencies
- ✅ Installed `@aws-sdk/s3-request-presigner` package

## ✅ Additional Files Created

### Migration & Backfill
- ✅ Created `/scripts/backfill-attachments.ts`
  - Backfills existing attachments with:
    - `originalName` extracted from key
    - `contentType` inferred from extension
    - `uploadedById` from expense.report.ownerId
    - `status` set to UPLOADED
    - `visibility` set to PRIVATE
    - `organizationId` from expense.report.organizationId

## 🔄 Next Steps (Not Yet Done)

### Phase 3: Testing & Cleanup
- ⏳ Run backfill script for existing attachments
  ```bash
  npx tsx scripts/backfill-attachments.ts
  ```

- ⏳ Make attachment fields required (second migration)
  - After backfill, make `originalName`, `contentType`, `uploadedById` non-nullable

- ⏳ Test upload workflow:
  - Create new receipt expense
  - Upload files
  - Verify in database and S3

- ⏳ Test download workflow:
  - Download attachment from expense detail
  - Verify presigned URL works

- ⏳ Remove @better-upload dependencies:
  ```bash
  pnpm remove @better-upload/client @better-upload/server
  ```

- ⏳ Delete legacy files:
  - `/src/server/better-upload/` directory
  - `/src/app/api/upload/route.ts`

- ⏳ Update expense detail page to show/download attachments

### Phase 4: Future Enhancements (Optional)
- ⏳ Organization logo upload endpoint
- ⏳ Orphaned file cleanup cron job
- ⏳ Rate limiting with Upstash Redis
- ⏳ File preview generation
- ⏳ Bulk download as ZIP

## 📝 Known Issues

1. **TypeScript Type Error**: AWS SDK type compatibility between `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
   - **Status**: Suppressed with `@ts-expect-error` comments
   - **Impact**: None at runtime, only TypeScript checking
   - **Reason**: Version mismatch in AWS SDK package types

2. **Legacy Attachments**: Existing attachments still use old key format
   - **Status**: Backfill script created
   - **Solution**: Run backfill script to migrate data

## 🎯 Migration Strategy

**Fresh Start Approach**: New uploads use new system, existing files remain with legacy keys.

**Storage Structure**:
```
s3://bucket/
├── attachment/{legacy-filename}           # Old format (legacy)
└── attachments/
    ├── private/{orgId}/{reportId}/{hash}.{ext}  # New format (receipts)
    └── public/{orgId}/logo/{hash}.{ext}         # New format (logos)
```

**Database Migration**:
1. ✅ Add nullable fields to Attachment model
2. ✅ Create and apply migration
3. ⏳ Run backfill script to populate data
4. ⏳ Make fields required in second migration
5. ⏳ Remove @better-upload dependencies

## 🔐 Security Features

- ✅ File size limits (5MB max)
- ✅ File type validation (PDF, images only)
- ✅ Extension blocklist (no executables)
- ✅ Ownership validation before upload
- ✅ Report status check (only draft/needs-revision)
- ✅ S3 verification before marking as uploaded
- ✅ Presigned URL expiration (5min upload, 1hr download)
- ✅ Soft delete with audit trail
- ✅ Permission-based downloads

## 📊 Testing Checklist

### Upload Tests
- [ ] Upload single PDF to receipt expense
- [ ] Upload multiple images to receipt expense
- [ ] Try uploading .exe file (should fail)
- [ ] Try uploading 10MB file (should fail)
- [ ] Try uploading to finalized report (should fail)
- [ ] Try uploading to other user's report (should fail)

### Download Tests
- [ ] Download own attachment (should work)
- [ ] Download other user's attachment (should fail)
- [ ] Download deleted attachment (should fail)
- [ ] Admin download any attachment (should work)

### Edge Cases
- [ ] Upload but don't confirm (PENDING record created)
- [ ] Confirm non-existent upload (should fail verification)
- [ ] Delete attachment from draft report (should work)
- [ ] Delete attachment from finalized report (should fail)

## 🚀 Deployment Steps

1. ✅ Apply database migration (already done)
2. ⏳ Run backfill script in production
3. ⏳ Monitor for errors
4. ⏳ Apply second migration to make fields required
5. ⏳ Remove @better-upload packages
6. ⏳ Delete legacy upload route and server config
7. ⏳ Test upload/download flows
8. ⏳ Update documentation

## 📦 Files Modified

**Created (8 files)**:
- `src/server/api/routers/attachment.ts`
- `src/server/storage/presigned.ts`
- `src/server/storage/validation.ts`
- `src/server/storage/keys.ts`
- `src/hooks/use-presigned-upload.ts`
- `scripts/backfill-attachments.ts`
- `prisma/migrations/20260201144721_add_attachment_metadata/migration.sql`

**Modified (7 files)**:
- `prisma/schema.prisma`
- `src/server/storage/s3-client.ts`
- `src/server/api/root.ts`
- `src/lib/validators.ts`
- `src/server/api/routers/expense.ts`
- `src/components/forms/expense/receipt.tsx`
- `packages/ui/src/components/upload-dropzone.tsx`

**To Delete (2 locations)**:
- `src/server/better-upload/` (directory)
- `src/app/api/upload/route.ts` (file)
