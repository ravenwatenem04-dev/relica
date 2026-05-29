import SwiftUI

struct AgentRow: View {
    let agent: Agent

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(agent.displayName)
                    .font(.body)
                    .fontWeight(.semibold)

                if let task = agent.currentTask {
                    Text(task.title)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                } else {
                    Text("No current task")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }

                Text(agent.model)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            Spacer()

            AgentStatusBadge(status: agent.status)
        }
        .padding(.vertical, 4)
    }
}
