import Foundation

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
