# OD-8: Add middleware API stubs

## Notes

I'll analyze the repository structure and implement API stubs for document data fetching and submission posting.

Let me first explore the repository structure to understand the codebase:

<repository_exploration>
<read_file>
<path>package.json</path>
</read_file>
<read_file>
<path>src</path>
</read_file>
<read_file>
<path>tsconfig.json</path>
</read_file>
</repository_exploration>

<read_file>
<path>src/app</path>
</read_file>

<read_file>
<path>src/app/api</path>
</read_file>

Now let me check if there's an existing API structure:

<read_file>
<path>src</path>
</read_file>

Let me explore the main app structure:

<read_file>
<path>.</path>
</read_file>

<read_file>
<path>src/app/page.tsx</path>
</read_file>

<read_file>
<path>src/app/layout.tsx</path>
</read_file>

Now I'll create the API middleware stubs for document fetching and submission posting:

<write_file>
<path>src/app/api/documents/[id]/route.ts</path>
<content>import { NextRequest, NextResponse } from 'next/server';

// Mock document data
const mockDocuments: Record<string, any> = {
  'doc-001': {
    id: 'doc-001',
    title: 'Sample Document 1',
    content: 'This is a sample document for testing purposes.',
    metadata: {
      author: 'John Doe',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      version: '1.0',
      status: 'active'
    },
    fields: [
      { id: 'field-1', name: 'Name', type: 'text', required: true },
      { id: 'field-2', name: 'Email', type: 'email', required: true },
      { id: 'field-3', name: 'Comments', type: 'textarea', required: false }
    ]
  },
  'doc-002': {
    id: 'doc-002',
    title: 'Sample Document 2',
    content: 'Another sample document with different fields.',
    metadata: {
      author: 'Jane Smith',
      createdAt: '2024-01-16T14:30:00Z',
      updatedAt: '2024-01-16T14:30:00Z',
      version: '1.0',
      status: 'active'
    },
    fields: [
      { id: 'field-1', name: 'Company', type: 'text', required: true },
      { id: 'field-2', name: 'Phone', type: 'tel', required: true },
      { id: 'field-3', name: 'Address', type: 'text', required: false }
    ]
  }
};

/**
 * GET /api/documents/[id]
 * Fetches a document by its ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const document = mockDocuments[id];

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found', documentId: id },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
</content>
</write_file>

<write_file>
<path>src/app/api/documents/route.ts</path>
<content>import { NextRequest, NextResponse } from 'next/server';

// Mock list of available documents
const mockDocumentsList = [
  {
    id: 'doc-001',
    title: 'Sample Document 1',
    description: 'A sample document for testing',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'doc-002',
    title: 'Sample Document 2',
    description: 'Another sample document',
    status: 'active',
    createdAt: '2024-01-16T14:30:00Z'
  },
  {
    id: 'doc-003',
    title: 'Sample Document 3',
    description: 'Third sample document',
    status: 'draft',
    createdAt: '2024-01-17T09:15:00Z'
  }
];

/**
 * GET /api/documents
 * Fetches a list of all available documents
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    let filteredDocuments = mockDocumentsList;

    // Filter by status if provided
    if (status) {
      filteredDocuments = filteredDocuments.filter(doc => doc.status === status);
    }

    // Apply pagination
    const paginatedDocuments = filteredDocuments.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedDocuments,
      pagination: {
        total: filteredDocuments.length,
        limit,
        offset,
        hasMore: offset + limit < filteredDocuments.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
</content>
</write_file>

<write_file>
<path>src/app/api/submissions/route.ts</path>
<content>import { NextRequest, NextResponse } from 'next/server';

// Mock storage for submissions (in-memory for this stub)
const mockSubmissions: Record<string, any> = {};
let submissionCounter = 1;

/**
 * POST /api/submissions
 * Creates a new document submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.documentId) {
      return NextResponse.json(
        { error: 'Missing required field: documentId' },
        { status: 400 }
      );
    }

    if (!body.data || typeof body.data !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid field: data' },
        { status: 400 }
      );
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    // Generate submission ID
    const submissionId = `sub-${String(submissionCounter).padStart(6, '0')}`;
    submissionCounter++;

    // Create submission record
    const submission = {
      id: submissionId,
      documentId: body.documentId,
      data: body.data,
      metadata: {
        submittedAt: new Date().toISOString(),
        submittedBy: body.userId || 'anonymous',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      status: 'submitted',
      validationErrors: []
    };

    // Store submission
    mockSubmissions[submissionId] = submission;

    return NextResponse.json({
      success: true,
      data: {
        submissionId: submission.id,
        status: submission.status,
        submittedAt: submission.metadata.submittedAt
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/submissions
 * Retrieves a list of submissions (optionally filtered by documentId)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    let submissions = Object.values(mockSubmissions);

    // Filter by documentId if provided
    if (documentId) {
      submissions = submissions.filter(sub => sub.documentId === documentId);
    }

    // Apply pagination
    const paginatedSubmissions = submissions.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedSubmissions,
      pagination: {
        total: submissions.length,
        limit,
        offset,
        hasMore: offset + limit < submissions.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
</content>
</write_file>

<write_file>
<path>src/app/api/submissions/[id]/route.ts</path>
<content>import { NextRequest, NextResponse } from 'next/server';

// Mock submission data
const mockSubmissionDetails: Record<string, any> = {
  'sub-000001': {
    id: 'sub-000001',
    documentId: 'doc-001',
    data: {
      'field-1': 'John Doe',
      'field-2': 'john.doe@example.com',
      'field-3': 'This is a test submission'
    },
    metadata: {
      submittedAt: '2024-01-18T10:30:00Z',
      submittedBy: 'user-123',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...'
    },
    status: 'submitted',
    validationErrors: []
  },
  'sub-000002': {
    id: 'sub-000002',
    documentId: 'doc-002',
    data: {
      'field-1': 'Acme Corp',
      'field-2': '+1-555-0123',
      'field-3': '123 Main St, City, State'
    },
    metadata: {
      submittedAt: '2024-01-18T11:45:00Z',
      submittedBy: 'user-456',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0...'
    },
    status: 'processed',
    validationErrors: []
  }
};

/**
 * GET /api/submissions/[id]
 * Retrieves a specific submission by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 250));

    const submission = mockSubmissionDetails[id];

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found', submissionId: id },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: submission
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/submissions/[id]
 * Updates a submission status or data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const submission = mockSubmissionDetails[id];

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found', submissionId: id },
        { status: 404 }
      );
    }

    // Update submission (mock implementation)
    if (body.status) {
      submission.status = body.status;
    }

    return NextResponse.json({
      success: true,
      data: submission,
      message: 'Submission updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
</content>
</write_file>

<write_file>
<path>src/app/api/README.md</path>
<content># API Middleware Stubs

This directory contains mock API endpoints for document management and submissions.

## Endpoints

### Documents

#### GET /api/documents
Retrieves a list of all available documents.

**Query Parameters:**
- `status` (optional): Filter by document status (e.g., 'active', 'draft')
- `limit` (optional): Number of results to return (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 3,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

#### GET /api/documents/[id]
Retrieves a specific document by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-001",
    "title": "Sample Document 1",
    "content": "...",
    "metadata": {...},
    "fields": [...]
  }
}
```

### Submissions

#### POST /api/submissions
Creates a new document submission.

**Request Body:**
```json
{
  "documentId": "doc-001",
  "data": {
    "field-1": "value1",
    "field-2": "value2"
  },
  "userId": "user-123" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "sub-000001",
    "status": "submitted",
    "submittedAt": "2024-01-18T10:30:00Z"
  }
}
```

#### GET /api/submissions
Retrieves a list of submissions.

**Query Parameters:**
- `documentId` (optional): Filter by document ID
- `limit` (optional): Number of results to return (default: 10)
- `offset` (optional): Pagination offset (default: 0)

#### GET /api/submissions/[id]
Retrieves a specific submission by ID.

#### PATCH /api/submissions/[id]
Updates a submission (e.g., change status).

**Request Body:**
```json
{
  "status": "processed"
}
```

## Mock Data

All endpoints use in-memory mock data for this pilot implementation. The data includes:
- 3 sample documents with various fields
- 2 sample submissions
- Simulated network delays (
