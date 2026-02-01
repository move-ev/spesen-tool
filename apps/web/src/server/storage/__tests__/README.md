# Storage Tests

Tests for the presigned URL upload system storage utilities.

## Test Files

### `validation.test.ts`
Tests file upload validation logic:
- File size limits (5MB max)
- MIME type validation (PDF, images only)
- Extension blocklist (executables)
- Edge cases (unicode, special characters)

**Coverage**: 100% of validation.ts

### `keys.test.ts`
Tests file key generation:
- Hash uniqueness (UUID-based)
- Extension extraction
- S3 key path generation (private/public)
- Concurrent upload safety

**Coverage**: 100% of keys.ts

### `file-validator.test.ts`
Tests magic number validation:
- PDF, JPEG, PNG, GIF, WebP detection
- Spoofing detection (exe as PDF)
- S3 interaction mocking
- Error handling

**Coverage**: ~95% of file-validator.ts (excludes S3 connection errors)

## Running Tests

```bash
# Run all storage tests
pnpm test src/server/storage

# Run specific test file
pnpm test validation.test.ts

# Run with coverage
pnpm test --coverage src/server/storage

# Watch mode
pnpm test --watch validation.test.ts
```

## Key Test Scenarios

### Security Tests
- ✅ MIME type spoofing detection
- ✅ Executable disguised as PDF
- ✅ File size limit enforcement
- ✅ Extension blocklist

### Concurrency Tests
- ✅ UUID prevents race conditions
- ✅ 100 concurrent uploads unique hashes
- ✅ Parallel file validation

### Edge Cases
- ✅ Zero-byte files
- ✅ Unicode filenames
- ✅ Special characters
- ✅ Multiple dots in filename
- ✅ Files without extension

## Mocking Strategy

**S3 Client**: Mocked using Vitest `vi.mock()`
**Database**: Mocked using Vitest `vi.mock()`
**Environment**: Mocked using `vi.mock("@/env")`

## Test Data

**Valid Files**:
- PDF: `[0x25, 0x50, 0x44, 0x46]` (%PDF)
- JPEG: `[0xFF, 0xD8, 0xFF]`
- PNG: `[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]`

**Invalid Files**:
- EXE: `[0x4D, 0x5A]` (MZ header)
- Random bytes: `[0x00, 0x01, 0x02, 0x03]`
