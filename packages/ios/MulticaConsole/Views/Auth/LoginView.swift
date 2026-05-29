import SwiftUI

struct LoginView: View {
    @Bindable var viewModel: AuthViewModel
    @State private var tokenInput = ""

    var body: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: "lock.shield")
                .font(.system(size: 60))
                .foregroundStyle(.tint)

            Text("Multica Console")
                .font(.largeTitle)
                .bold()

            Text("Enter your API token to sign in")
                .foregroundStyle(.secondary)

            VStack(spacing: 12) {
                SecureField("API Token", text: $tokenInput)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.password)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .disabled(viewModel.state == .loading)

                Button {
                    Task { await viewModel.login(token: tokenInput) }
                } label: {
                    Group {
                        if viewModel.state == .loading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Sign In")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                }
                .background(tokenInput.isEmpty ? Color.gray : Color.accentColor)
                .foregroundColor(.white)
                .clipShape(.rect(cornerRadius: 8))
                .disabled(tokenInput.isEmpty || viewModel.state == .loading)
            }
            .padding(.horizontal, 32)

            if let error = viewModel.error {
                Text(error)
                    .foregroundStyle(.red)
                    .font(.callout)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Spacer()
        }
        .task {
            await viewModel.checkAuth()
        }
    }
}
