import Foundation

struct User: Codable {
    let id: String
    let email: String?
    let name: String?
    let displayName: String?
}

struct Agent: Codable {
    struct CurrentTask: Codable {
        let id: String
        let title: String
    }

    let id: String
    let displayName: String
    let status: String
    let model: String
    let currentTask: CurrentTask?
    let capabilities: [String]
}

struct AgentListResponse: Codable {
    let agents: [Agent]
    let total: Int
}

struct Issue: Codable {
    let id: String
    let title: String
    let description: String?
    let status: String
    let priority: String?
    let projectId: String?
    let assigneeId: String?
    let assigneeType: String?
    let metadata: [String: JSONValue]
    let labels: [String]
    let parentIssueId: String?
    let dueDate: String?
    let createdAt: String
    let updatedAt: String
}

struct IssueListResponse: Codable {
    let issues: [Issue]
    let total: Int
    let hasMore: Bool
}

struct IssueFilters {
    let status: String?
    let priority: String?
    let projectId: String?
    let assigneeId: String?
    let search: String?
    let limit: Int?
    let offset: Int?
}

struct CreateIssueRequest: Codable {
    let title: String
    let description: String?
    let priority: String?
    let projectId: String?
    let assigneeId: String?
    let parentIssueId: String?
}

struct Comment: Codable {
    struct Attachment: Codable {
        let id: String
        let filename: String
        let size: Int
        let mimeType: String
    }

    let id: String
    let issueId: String
    let parentId: String?
    let authorType: String
    let authorId: String
    let authorName: String
    let content: String
    let attachments: [Attachment]
    let createdAt: String
    let updatedAt: String
}

struct UsageSummary: Codable {
    struct TokenUsage: Codable {
        let input: Int
        let output: Int
    }

    struct Period: Codable {
        let from: String
        let to: String
    }

    let period: Period
    let totalRuns: Int
    let successfulRuns: Int
    let failedRuns: Int
    let totalTokens: TokenUsage?
    let estimatedCost: Double?
    let agentBreakdown: [TopAgent]
    let dataAvailable: Bool
}

struct TopAgent: Codable {
    let agentId: String
    let agentName: String
    let runCount: Int
    let successRate: Double
    let totalTokens: UsageSummary.TokenUsage?
    let estimatedCost: Double?
}

enum JSONValue: Codable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([String: JSONValue].self) {
            self = .object(value)
        } else if let value = try? container.decode([JSONValue].self) {
            self = .array(value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported JSON value")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        switch self {
        case .string(let value):
            try container.encode(value)
        case .number(let value):
            try container.encode(value)
        case .bool(let value):
            try container.encode(value)
        case .object(let value):
            try container.encode(value)
        case .array(let value):
            try container.encode(value)
        case .null:
            try container.encodeNil()
        }
    }
}
