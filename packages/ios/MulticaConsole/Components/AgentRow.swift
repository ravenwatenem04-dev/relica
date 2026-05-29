import SwiftUI

struct AgentRow: View {
    let agent: Agent

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(agent.displayName)
                    .font(.headline)
                if let task = agent.currentTask {
                    Text(task.title)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Text(agent.model)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }

            Spacer()

            AgentStatusBadge(status: agent.status)
        }
        .padding(.vertical, 4)
    }
}
