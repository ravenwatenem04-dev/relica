import Observation
import Foundation

@Observable
@MainActor
final class IssueDetailViewModel {
    var issue: Issue?
    var comments: [Comment] = []
    var agents: [Agent] = []
    var isLoading = false
    var isLoadingComments = false
    var isLoadingAgents = false
    var error: String?
    var commentError: String?

    var isAddCommentPresented = false
    var newCommentText = ""
    var isAssignAgentPresented = false
    var isStatusPickerPresented = false

    func loadIssue(id: String) async {
        isLoading = true
        error = nil

        do {
            issue = try await APIClient.shared.getIssue(id: id)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func loadComments(issueId: String) async {
        isLoadingComments = true

        do {
            let response = try await APIClient.shared.listComments(issueId: issueId)
            comments = response.comments
        } catch {
            commentError = error.localizedDescription
        }

        isLoadingComments = false
    }

    func loadAgents() async {
        guard agents.isEmpty else { return }
        isLoadingAgents = true

        do {
            let response = try await APIClient.shared.listAgents()
            agents = response.agents
        } catch {
            commentError = error.localizedDescription
        }

        isLoadingAgents = false
    }

    func changeStatus(issueId: String, status: IssueStatus) async {
        do {
            issue = try await APIClient.shared.changeIssueStatus(id: issueId, status: status)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func addComment(issueId: String) async {
        guard !newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        do {
            let comment = try await APIClient.shared.addComment(issueId: issueId, content: newCommentText)
            comments.append(comment)
            newCommentText = ""
            isAddCommentPresented = false
        } catch {
            commentError = error.localizedDescription
        }
    }

    func assignAgent(issueId: String, agentId: String) async {
        do {
            issue = try await APIClient.shared.assignIssue(id: issueId, agentId: agentId)
            isAssignAgentPresented = false
        } catch {
            self.error = error.localizedDescription
        }
    }

    func unassignAgent(issueId: String) async {
        do {
            issue = try await APIClient.shared.unassignIssue(id: issueId)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func load(issueId: String) async {
        await loadIssue(id: issueId)
        await loadComments(issueId: issueId)
        await loadAgents()
    }
}
