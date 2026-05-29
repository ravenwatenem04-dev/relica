import SwiftUI

struct ActiveRunsSection: View {
    let agents: [Agent]

    var body: some View {
        Section {
            if agents.isEmpty {
                EmptyRow(icon: "antenna.radiowaves.left.and.right", text: "Nothing here")
            } else {
                ForEach(agents) { agent in
                    NavigationLink(value: agent) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(agent.displayName)
                                    .font(.headline)
                                if let task = agent.currentTask {
                                    Text(task.title)
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(1)
                                }
                            }
                            Spacer()
                            ProgressView()
                                .scaleEffect(0.8)
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
        } header: {
            SectionHeader(title: "Active Runs", icon: "antenna.radiowaves.left.and.right", count: agents.count)
        }
    }
}

struct EmptyRow: View {
    let icon: String
    let text: String

    var body: some View {
        HStack {
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(.secondary)
                Text(text)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 16)
            Spacer()
        }
    }
}

struct SectionHeader: View {
    let title: String
    let icon: String
    let count: Int

    var body: some View {
        HStack {
            Label(title, systemImage: icon)
            Spacer()
            if count > 0 {
                Text("\(count)")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(.tertiary))
            }
        }
    }
}
