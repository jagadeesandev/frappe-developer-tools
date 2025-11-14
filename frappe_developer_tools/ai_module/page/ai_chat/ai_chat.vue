<template>
	<div class="ai-chat-page">
		<!-- Header -->
		<div class="ai-chat-header">
			<div class="header-content">
				<h1>
					<i class="fas fa-comments"></i>
					AI Chat Assistant
				</h1>
				<p class="subtitle">Powered by Google Gemini AI</p>
			</div>
			<div class="header-actions">
				<button class="btn btn-sm btn-secondary" @click="startNewChat" v-if="currentChatId !== 'new'">
					<i class="fas fa-plus"></i>
					New Chat
				</button>
			</div>
		</div>

		<!-- Main Container -->
		<div class="ai-chat-main">
			<!-- Sidebar -->
			<div class="ai-chat-sidebar">
				<div class="sidebar-section">
					<h5>Recent Chats</h5>
					<div class="chat-history" v-if="chatHistory.length > 0">
						<div 
							v-for="chat in chatHistory" 
							:key="chat.name"
							class="chat-item"
							:class="{ active: currentChatId === chat.name }"
							@click="loadChat(chat.name)"
						>
							<div class="chat-item-title">{{ chat.title }}</div>
							<div class="chat-item-date">{{ formatDate(chat.modified) }}</div>
						</div>
					</div>
					<div class="empty-state" v-else>
						<p>No chats yet. Start a conversation!</p>
					</div>
				</div>
			</div>

			<!-- Chat Window -->
			<div class="ai-chat-window">
				<!-- Messages Container -->
				<div class="messages-container" ref="messagesContainer">
					<div v-if="messages.length === 0" class="welcome-message">
						<div class="welcome-icon">
							<i class="fas fa-sparkles"></i>
						</div>
						<h3>Welcome to AI Chat</h3>
						<p>Start a conversation by typing your message below</p>
					</div>
					<div v-else>
						<div 
							v-for="(message, index) in messages" 
							:key="index"
							class="message"
							:class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'ai' }"
						>
							<div class="message-avatar" v-if="message.role === 'ai'">
								<i class="fas fa-robot"></i>
							</div>
							<div class="message-content">
								<div class="message-text">{{ message.content }}</div>
								<div class="message-time">{{ formatTime(message.timestamp) }}</div>
							</div>
							<div class="message-avatar user-avatar" v-if="message.role === 'user'">
								<i class="fas fa-user"></i>
							</div>
						</div>
					</div>
				</div>

				<!-- Input Area -->
				<div class="input-area">
					<form @submit.prevent="sendMessage" class="chat-form">
						<div class="input-group">
							<textarea
								v-model="userInput"
								@keydown.enter.ctrl="sendMessage"
								@keydown.shift.enter="addNewline"
								class="form-control chat-input"
								placeholder="Type your message... (Ctrl+Enter to send)"
								rows="3"
								:disabled="isLoading"
							></textarea>
							<button 
								type="submit" 
								class="btn btn-primary send-btn"
								:disabled="!userInput.trim() || isLoading"
							>
								<span v-if="!isLoading">
									<i class="fas fa-paper-plane"></i>
									Send
								</span>
								<span v-else>
									<i class="fas fa-spinner fa-spin"></i>
									Sending...
								</span>
							</button>
						</div>
					</form>
					<p class="input-help">Tip: Press Ctrl+Enter to send quickly</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'AIChatPage',
	data() {
		return {
			messages: [],
			userInput: '',
			isLoading: false,
			currentChatId: 'new',
			chatHistory: [],
			currentUser: null,
		};
	},
	mounted() {
		this.init();
		this.scrollToBottom();
		this.currentUser = frappe.session.user;
	},
	methods: {
		init() {
			this.loadChatHistory();
		},
		loadChatHistory() {
			frappe.call({
				method: 'frappe_developer_tools.ai_module.api.get_chat_history',
				callback: (r) => {
					if (r.message) {
						this.chatHistory = r.message;
					}
				},
				error: () => {
					frappe.msgprint('Failed to load chat history');
				}
			});
		},
		loadChat(chatId) {
			this.currentChatId = chatId;
			frappe.call({
				method: 'frappe_developer_tools.ai_module.api.get_chat_messages',
				args: { chat_id: chatId },
				callback: (r) => {
					if (r.message) {
						this.messages = r.message;
						this.$nextTick(() => this.scrollToBottom());
					}
				},
				error: () => {
					frappe.msgprint('Failed to load chat messages');
				}
			});
		},
		sendMessage() {
			const message = this.userInput.trim();
			if (!message || this.isLoading) return;

			// Add user message to UI
			this.messages.push({
				role: 'user',
				content: message,
				timestamp: new Date()
			});

			this.userInput = '';
			this.isLoading = true;
			this.$nextTick(() => this.scrollToBottom());

			// Send to backend
			frappe.call({
				method: 'frappe_developer_tools.ai_module.api.send_chat_message',
				args: {
					chat_id: this.currentChatId,
					message: message
				},
				callback: (r) => {
					this.isLoading = false;
					if (r.message && r.message.success) {
						// Update chat ID if this is a new chat
						if (this.currentChatId === 'new') {
							this.currentChatId = r.message.chat_id;
						}

						// Add AI response
						this.messages.push({
							role: 'ai',
							content: r.message.response,
							timestamp: new Date()
						});

						this.$nextTick(() => this.scrollToBottom());
						this.loadChatHistory();
					} else {
						frappe.msgprint({
							title: 'Error',
							indicator: 'red',
							message: r.message?.error || 'Failed to send message'
						});
					}
				},
				error: (err) => {
					this.isLoading = false;
					frappe.msgprint({
						title: 'Error',
						indicator: 'red',
						message: 'Failed to send message. Please try again.'
					});
				}
			});
		},
		startNewChat() {
			this.messages = [];
			this.userInput = '';
			this.currentChatId = 'new';
			this.loadChatHistory();
		},
		scrollToBottom() {
			this.$nextTick(() => {
				const container = this.$refs.messagesContainer;
				if (container) {
					container.scrollTop = container.scrollHeight;
				}
			});
		},
		formatDate(date) {
			if (!date) return '';
			const d = new Date(date);
			const today = new Date();
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);

			if (d.toDateString() === today.toDateString()) {
				return 'Today';
			} else if (d.toDateString() === yesterday.toDateString()) {
				return 'Yesterday';
			} else {
				return d.toLocaleDateString();
			}
		},
		formatTime(timestamp) {
			if (!timestamp) return '';
			const date = new Date(timestamp);
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		},
		addNewline(e) {
			this.userInput += '\n';
		}
	}
};
</script>

<style scoped>
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

.ai-chat-page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Header */
.ai-chat-header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 25px 30px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.header-content h1 {
	font-size: 28px;
	font-weight: 600;
	margin-bottom: 5px;
	display: flex;
	align-items: center;
	gap: 12px;
}

.header-content h1 i {
	font-size: 32px;
}

.subtitle {
	font-size: 13px;
	opacity: 0.9;
	margin: 0;
}

.header-actions {
	display: flex;
	gap: 10px;
}

/* Main Container */
.ai-chat-main {
	display: flex;
	flex: 1;
	overflow: hidden;
}

/* Sidebar */
.ai-chat-sidebar {
	width: 280px;
	background: white;
	border-right: 1px solid #e0e0e0;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
}

.sidebar-section {
	padding: 20px;
	flex: 1;
	display: flex;
	flex-direction: column;
}

.sidebar-section h5 {
	font-size: 14px;
	font-weight: 600;
	color: #333;
	margin-bottom: 15px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.chat-history {
	display: flex;
	flex-direction: column;
	gap: 8px;
	flex: 1;
}

.chat-item {
	padding: 12px;
	background: #f9f9f9;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.chat-item:hover {
	background: #f0f0f0;
	border-color: #667eea;
	transform: translateX(4px);
}

.chat-item.active {
	background: #667eea;
	color: white;
	border-color: #667eea;
}

.chat-item-title {
	font-size: 13px;
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.chat-item-date {
	font-size: 11px;
	opacity: 0.7;
	margin-top: 4px;
}

.empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	text-align: center;
	opacity: 0.6;
}

.empty-state p {
	font-size: 13px;
}

/* Chat Window */
.ai-chat-window {
	flex: 1;
	display: flex;
	flex-direction: column;
	background: white;
	position: relative;
}

.messages-container {
	flex: 1;
	overflow-y: auto;
	padding: 30px;
	display: flex;
	flex-direction: column;
	gap: 15px;
}

/* Welcome Message */
.welcome-message {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	opacity: 0.6;
	text-align: center;
}

.welcome-icon {
	font-size: 64px;
	margin-bottom: 20px;
	color: #667eea;
}

.welcome-message h3 {
	font-size: 24px;
	margin-bottom: 10px;
	color: #333;
}

.welcome-message p {
	font-size: 14px;
	color: #666;
}

/* Messages */
.message {
	display: flex;
	gap: 12px;
	animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.user-message {
	justify-content: flex-end;
	flex-direction: row-reverse;
}

.ai-message {
	justify-content: flex-start;
}

.message-avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	flex-shrink: 0;
}

.message-avatar.user-avatar {
	background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.message-content {
	max-width: 65%;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.user-message .message-content {
	align-items: flex-end;
}

.message-text {
	padding: 12px 16px;
	border-radius: 12px;
	word-wrap: break-word;
	white-space: pre-wrap;
	line-height: 1.4;
	font-size: 14px;
}

.user-message .message-text {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.ai-message .message-text {
	background: #f0f0f0;
	color: #333;
	border: 1px solid #e0e0e0;
}

.message-time {
	font-size: 11px;
	opacity: 0.6;
	padding: 0 4px;
}

.user-message .message-time {
	text-align: right;
}

/* Input Area */
.input-area {
	background: white;
	border-top: 1px solid #e0e0e0;
	padding: 20px;
	flex-shrink: 0;
}

.chat-form {
	margin-bottom: 10px;
}

.input-group {
	display: flex;
	gap: 12px;
	align-items: flex-end;
}

.chat-input {
	flex: 1;
	padding: 12px 16px;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	resize: none;
	font-family: inherit;
	font-size: 14px;
	transition: border-color 0.3s ease;
	max-height: 120px;
}

.chat-input:focus {
	outline: none;
	border-color: #667eea;
	box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chat-input:disabled {
	background: #f5f5f5;
	opacity: 0.6;
}

.send-btn {
	padding: 12px 24px;
	border-radius: 8px;
	border: none;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	cursor: pointer;
	font-weight: 600;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.input-help {
	font-size: 12px;
	opacity: 0.6;
	margin: 0;
	text-align: right;
}

/* Scrollbar Styling */
.messages-container::-webkit-scrollbar,
.ai-chat-sidebar::-webkit-scrollbar {
	width: 8px;
}

.messages-container::-webkit-scrollbar-track,
.ai-chat-sidebar::-webkit-scrollbar-track {
	background: transparent;
}

.messages-container::-webkit-scrollbar-thumb,
.ai-chat-sidebar::-webkit-scrollbar-thumb {
	background: #ccc;
	border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.ai-chat-sidebar::-webkit-scrollbar-thumb:hover {
	background: #999;
}

/* Responsive Design */
@media (max-width: 768px) {
	.ai-chat-sidebar {
		display: none;
	}

	.message-content {
		max-width: 85%;
	}

	.header-content h1 {
		font-size: 20px;
	}

	.messages-container {
		padding: 15px;
	}

	.input-area {
		padding: 15px;
	}
}
</style>
