import Foundation

struct Agent: Identifiable, Codable {
    let id: String
    let displayName: String
    let status: AgentStatus
    let model: String
    let currentTask: CurrentTask?
    let capabilities: [String]

    enum AgentStatus: String, Codable {
        case available
        case running
        case blocked
        case disabled

        var displayName: String {
            switch self {
            case .available: return "Available"
            case .running: return "Running"
            case .blocked: return "Blocked"
            case .disabled: return "Disabled"
            }
        }
    }
}

struct CurrentTask: Codable {
    let id: String
    let title: String
}

struct AgentListResponse: Codable {
    let agents: [Agent]
    let total: Int
}
