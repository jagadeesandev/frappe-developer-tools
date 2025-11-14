// AI Chat Page JavaScript Implementation
// This file contains the complete implementation for the AI Chat page

frappe.pages['ai-chat'].on_page_load = function(wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'AI Chat',
		single_column: true
	});

	// Create main container
	const container = document.createElement('div');
	container.id = 'ai-chat-container';
	container.className = 'ai-chat-page';
	page.main.appendChild(container);

	// Initialize the AI Chat App
	new AIChatApp(container);
};

// AI Chat Application Class
class AIChatApp {
	constructor(container) {
		this.container = container;
		this.messages = [];
		this.chatHistory = [];
		this.currentChatId = 'new';
		this.userInput = '';
		this.isLoading = false;
		this.currentUser = frappe.session.user;
		this.init();
	}

	init() {
		this.render();
		this.setupEventListeners();
		this.loadChatHistory();
		this.addStyles();
	}

	render() {
		this.container.innerHTML = `
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
					<button class="btn btn-sm btn-secondary" id="new-chat-btn">
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
						<div class="chat-history" id="chat-history">
							<!-- Populated by JavaScript -->
						</div>
					</div>
				</div>

				<!-- Chat Window -->
				<div class="ai-chat-window">
					<!-- Messages Container -->
					<div class="messages-container" id="messages-container">
						<div class="welcome-message">
							<div class="welcome-icon">
								<i class="fas fa-sparkles"></i>
							</div>
							<h3>Welcome to AI Chat</h3>
							<p>Start a conversation by typing your message below</p>
						</div>
					</div>

					<!-- Input Area -->
					<div class="input-area">
						<form class="chat-form" id="chat-form">
							<div class="input-group">
								<textarea
									id="user-input"
									class="form-control chat-input"
									placeholder="Type your message... (Ctrl+Enter to send)"
									rows="3"
								></textarea>
								<button type="submit" class="btn btn-primary send-btn">
									<span id="send-btn-text">
										<i class="fas fa-paper-plane"></i>
										Send
									</span>
									<span id="loading-spinner" style="display: none;">
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
		`;
	}

	addStyles() {
		if (document.getElementById('ai-chat-styles')) return;

		const style = document.createElement('style');
		style.id = 'ai-chat-styles';
		style.innerHTML = `
			.ai-chat-page {
				display: flex;
				flex-direction: column;
				height: 100%;
				background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			}

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
				margin: 0;
			}

			.header-content h1 i {
				font-size: 32px;
			}

			.subtitle {
				font-size: 13px;
				opacity: 0.9;
				margin: 0;
			}

			.ai-chat-main {
				display: flex;
				flex: 1;
				overflow: hidden;
			}

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
				margin-top: 0;
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
				flex: 1;
			}

			.empty-state p {
				font-size: 13px;
				margin: 0;
			}

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
				margin-top: 0;
			}

			.welcome-message p {
				font-size: 14px;
				color: #666;
				margin: 0;
			}

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
		`;

		document.head.appendChild(style);
	}

	setupEventListeners() {
		// Send message form
		document.getElementById('chat-form').addEventListener('submit', (e) => {
			e.preventDefault();
			this.sendMessage();
		});

		// Ctrl+Enter to send
		document.getElementById('user-input').addEventListener('keydown', (e) => {
			if (e.ctrlKey && e.key === 'Enter') {
				e.preventDefault();
				this.sendMessage();
			}
		});

		// New chat button
		document.getElementById('new-chat-btn').addEventListener('click', () => {
			this.startNewChat();
		});
	}

	sendMessage() {
		const input = document.getElementById('user-input');
		const message = input.value.trim();

		if (!message || this.isLoading) return;

		// Add user message to UI
		this.addMessageToUI('user', message);
		input.value = '';
		this.setLoading(true);

		// Send to backend
		frappe.call({
			method: 'frappe_developer_tools.ai_module.api.send_chat_message',
			args: {
				chat_id: this.currentChatId,
				message: message
			},
			callback: (r) => {
				this.setLoading(false);
				if (r.message && r.message.success) {
					// Update chat ID if new
					if (this.currentChatId === 'new') {
						this.currentChatId = r.message.chat_id;
					}

					// Add AI response
					this.addMessageToUI('ai', r.message.response);
					this.loadChatHistory();
				} else {
					frappe.msgprint({
						title: 'Error',
						indicator: 'red',
						message: r.message?.error || 'Failed to send message'
					});
				}
			},
			error: () => {
				this.setLoading(false);
				frappe.msgprint({
					title: 'Error',
					indicator: 'red',
					message: 'Failed to send message. Please try again.'
				});
			}
		});
	}

	addMessageToUI(role, content) {
		const container = document.getElementById('messages-container');

		// Remove welcome message if this is first message
		const welcome = container.querySelector('.welcome-message');
		if (welcome) welcome.remove();

		const messageEl = document.createElement('div');
		messageEl.className = `message ${role === 'user' ? 'user-message' : 'ai-message'}`;

		const avatar = document.createElement('div');
		avatar.className = `message-avatar ${role === 'user' ? 'user-avatar' : ''}`;
		avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

		const contentEl = document.createElement('div');
		contentEl.className = 'message-content';

		const textEl = document.createElement('div');
		textEl.className = 'message-text';
		textEl.textContent = content;

		const timeEl = document.createElement('div');
		timeEl.className = 'message-time';
		timeEl.textContent = this.formatTime(new Date());

		contentEl.appendChild(textEl);
		contentEl.appendChild(timeEl);

		if (role === 'user') {
			messageEl.appendChild(contentEl);
			messageEl.appendChild(avatar);
		} else {
			messageEl.appendChild(avatar);
			messageEl.appendChild(contentEl);
		}

		container.appendChild(messageEl);
		this.scrollToBottom();
	}

	loadChatHistory() {
		frappe.call({
			method: 'frappe_developer_tools.ai_module.api.get_chat_history',
			callback: (r) => {
				if (r.message) {
					this.renderChatHistory(r.message);
				}
			}
		});
	}

	renderChatHistory(chats) {
		const container = document.getElementById('chat-history');
		container.innerHTML = '';

		if (chats.length === 0) {
			container.innerHTML = `
				<div class="empty-state">
					<p>No chats yet. Start a conversation!</p>
				</div>
			`;
			return;
		}

		chats.forEach((chat) => {
			const chatEl = document.createElement('div');
			chatEl.className = `chat-item ${this.currentChatId === chat.name ? 'active' : ''}`;
			chatEl.innerHTML = `
				<div class="chat-item-title">${frappe.utils.html_escape(chat.title)}</div>
				<div class="chat-item-date">${this.formatDate(chat.modified)}</div>
			`;
			chatEl.addEventListener('click', () => this.loadChat(chat.name));
			container.appendChild(chatEl);
		});
	}

	loadChat(chatId) {
		this.currentChatId = chatId;
		// Update active state
		document.querySelectorAll('.chat-item').forEach((el) => {
			el.classList.remove('active');
		});
		event.target.closest('.chat-item').classList.add('active');

		// Load messages
		frappe.call({
			method: 'frappe_developer_tools.ai_module.api.get_chat_messages',
			args: { chat_id: chatId },
			callback: (r) => {
				if (r.message) {
					this.renderMessages(r.message);
				}
			}
		});
	}

	renderMessages(messages) {
		const container = document.getElementById('messages-container');
		container.innerHTML = '';

		if (messages.length === 0) {
			container.innerHTML = `
				<div class="welcome-message">
					<div class="welcome-icon">
						<i class="fas fa-sparkles"></i>
					</div>
					<h3>Empty Chat</h3>
					<p>No messages yet</p>
				</div>
			`;
			return;
		}

		messages.forEach((msg) => {
			this.addMessageToUI(msg.role, msg.content);
		});
	}

	startNewChat() {
		this.currentChatId = 'new';
		document.getElementById('messages-container').innerHTML = `
			<div class="welcome-message">
				<div class="welcome-icon">
					<i class="fas fa-sparkles"></i>
				</div>
				<h3>Welcome to AI Chat</h3>
				<p>Start a conversation by typing your message below</p>
			</div>
		`;
		document.getElementById('user-input').value = '';
		document.querySelectorAll('.chat-item').forEach((el) => {
			el.classList.remove('active');
		});
		this.loadChatHistory();
	}

	scrollToBottom() {
		const container = document.getElementById('messages-container');
		container.scrollTop = container.scrollHeight;
	}

	setLoading(loading) {
		const btn = document.querySelector('.send-btn');
		const input = document.getElementById('user-input');
		const spinner = document.getElementById('loading-spinner');
		const btnText = document.getElementById('send-btn-text');

		if (loading) {
			btn.disabled = true;
			input.disabled = true;
			spinner.style.display = 'inline';
			btnText.style.display = 'none';
		} else {
			btn.disabled = false;
			input.disabled = false;
			spinner.style.display = 'none';
			btnText.style.display = 'inline';
		}
	}

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
	}

	formatTime(date) {
		if (!date) return '';
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
}
