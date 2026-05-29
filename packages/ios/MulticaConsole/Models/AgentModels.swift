import Foundation

struct Agent: Codable, Identifiable, Sendable {
    let id: String
    let displayName: String
    let status: AgentStatus
    let model: String
    let currentTask: TaskRef?
    let capabilities: [String]
}

enum AgentStatus: String, Codable, Sendable {
    case available
    case running
    case blocked
    case disabled
}

struct TaskRef: Codable, Sendable {
    let id: String
    let title: String
}

struct AgentListResponse: Codable {
    let agents: [Agent]
    let total: Int
}

struct Issue: Codable, Identifiable, Sendable {
    let id: String
    let title: String
    let description: String?
    let status: String
    let priority: String?
    let projectId: String?
    let assigneeId: String?
    let assigneeType: String?
    let labels: [String]
    let parentIssueId: String?
    let dueDate: String?
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id, title, description, status, priority
        case projectId, assigneeId, assigneeType, labels
        case parentIssueId, dueDate, createdAt, updatedAt
    }
}

struct IssueListResponse: Codable {
    let issues: [Issue]
    let total: Int
    let hasMore: Bool
}

struct AssignRequest: Codable {
    let agentId: String
}

struct Run: Codable, Identifiable, Sendable {
    let id: String
    let issueId: String
    let agentId: String
    let agentName: String
    let status: String
    let startedAt: String?
    let completedAt: String?
    let model: String?
    let tokenUsage: TokenUsage?
    let estimatedCost: Double?
    let failureReason: String?
    let duration: Double?
}

struct TokenUsage: Codable, Sendable {
    let input: Int
    let output: Int
}

struct RunListResponse: Codable {
    let runs: [Run]
}
