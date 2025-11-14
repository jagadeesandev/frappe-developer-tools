frappe.pages['ai-chat'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'AI Chat',
		single_column: true
	});

	page.main.html(`
		<div id="ai-chat-container" class="container-fluid">
			<div class="chat-wrapper">
				<div class="chat-header">
					<h2>AI Assistant</h2>
					<button class="btn btn-sm btn-secondary" id="new-chat-btn">New Chat</button>
				</div>
				
				<div class="chat-main">
					<!-- Chat History -->
					<div class="chat-sidebar">
						<div class="chat-list">
							<h5>Recent Chats</h5>
							<div id="chat-history" class="chat-history-list">
								<!-- Populated by JavaScript -->
							</div>
						</div>
					</div>
					
					<!-- Chat Window -->
					<div class="chat-window">
						<div class="messages-container" id="messages-container">
							<!-- Messages will be displayed here -->
						</div>
						
						<!-- Input Area -->
						<div class="input-area">
							<form id="chat-form" class="chat-input-form">
								<div class="input-group">
									<textarea 
										id="user-input" 
										class="form-control" 
										placeholder="Type your message here..."
										rows="3"
										required
									></textarea>
									<button type="submit" class="btn btn-primary">
										<span id="send-btn-text">Send</span>
										<span id="loading-spinner" class="spinner-border spinner-border-sm ml-2" style="display: none;"></span>
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	`);

	const chatApp = {
		currentChatId: 'new',
		
		init: function() {
			this.setupEventListeners();
			this.loadChatHistory();
		},
		
		setupEventListeners: function() {
			const self = this;
			
			// Send message on form submit
			document.getElementById('chat-form').addEventListener('submit', function(e) {
				e.preventDefault();
				self.sendMessage();
			});
			
			// New chat button
			document.getElementById('new-chat-btn').addEventListener('click', function() {
				self.startNewChat();
			});
			
			// Auto-resize textarea
			const textarea = document.getElementById('user-input');
			textarea.addEventListener('input', function() {
				this.style.height = 'auto';
				this.style.height = Math.min(this.scrollHeight, 200) + 'px';
			});
		},
		
		sendMessage: function() {
			const userInput = document.getElementById('user-input').value.trim();
			
			if (!userInput) return;
			
			this.displayUserMessage(userInput);
			this.setLoading(true);
			
			frappe.call({
				method: 'frappe_developer_tools.ai_module.gemini_utils.send_chat_message',
				args: {
					chat_id: this.currentChatId,
					message: userInput
				},
				callback: (r) => {
					this.setLoading(false);
					
					if (r.message.success) {
						this.currentChatId = r.message.chat_id;
						this.displayAIMessage(r.message.response);
						document.getElementById('user-input').value = '';
						this.loadChatHistory();
					} else {
						frappe.msgprint({
							title: 'Error',
							indicator: 'red',
							message: r.message.error
						});
					}
				},
				error: (err) => {
					this.setLoading(false);
					frappe.msgprint({
						title: 'Error',
						indicator: 'red',
						message: 'Failed to send message'
					});
				}
			});
		},
		
		displayUserMessage: function(message) {
			const container = document.getElementById('messages-container');
			const messageEl = document.createElement('div');
			messageEl.className = 'message user-message';
			messageEl.innerHTML = `<div class="message-content">${this.escapeHtml(message)}</div>`;
			container.appendChild(messageEl);
			this.scrollToBottom();
		},
		
		displayAIMessage: function(message) {
			const container = document.getElementById('messages-container');
			const messageEl = document.createElement('div');
			messageEl.className = 'message ai-message';
			messageEl.innerHTML = `<div class="message-content">${this.escapeHtml(message)}</div>`;
			container.appendChild(messageEl);
			this.scrollToBottom();
		},
		
		scrollToBottom: function() {
			const container = document.getElementById('messages-container');
			container.scrollTop = container.scrollHeight;
		},
		
		setLoading: function(loading) {
			const btn = document.querySelector('#chat-form button[type="submit"]');
			const spinner = document.getElementById('loading-spinner');
			const btnText = document.getElementById('send-btn-text');
			
			if (loading) {
				btn.disabled = true;
				spinner.style.display = 'inline-block';
				btnText.textContent = 'Sending...';
			} else {
				btn.disabled = false;
				spinner.style.display = 'none';
				btnText.textContent = 'Send';
			}
		},
		
		startNewChat: function() {
			this.currentChatId = 'new';
			document.getElementById('messages-container').innerHTML = '';
			document.getElementById('user-input').value = '';
		},
		
		loadChatHistory: function() {
			// This would load chat history from the database
			// Placeholder for now
		},
		
		escapeHtml: function(text) {
			const map = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#039;'
			};
			return text.replace(/[&<>"']/g, m => map[m]);
		}
	};
	
	chatApp.init();
};

// Add CSS styles
frappe.require(['/api/method/frappe.client.get_list'], function() {
	const style = document.createElement('style');
	style.innerHTML = `
		#ai-chat-container {
			padding: 0;
			height: calc(100vh - 120px);
			background: #f5f5f5;
		}
		
		.chat-wrapper {
			display: flex;
			flex-direction: column;
			height: 100%;
			background: white;
		}
		
		.chat-header {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			padding: 20px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		}
		
		.chat-header h2 {
			margin: 0;
		}
		
		.chat-main {
			display: flex;
			flex: 1;
			overflow: hidden;
		}
		
		.chat-sidebar {
			width: 250px;
			background: #f9f9f9;
			border-right: 1px solid #e0e0e0;
			padding: 20px;
			overflow-y: auto;
		}
		
		.chat-sidebar h5 {
			margin-top: 0;
			color: #333;
		}
		
		.chat-history-list {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		
		.chat-item {
			padding: 10px;
			background: white;
			border-radius: 4px;
			cursor: pointer;
			border: 1px solid #e0e0e0;
			transition: all 0.2s;
		}
		
		.chat-item:hover {
			background: #f0f0f0;
			border-color: #667eea;
		}
		
		.chat-window {
			flex: 1;
			display: flex;
			flex-direction: column;
			padding: 20px;
		}
		
		.messages-container {
			flex: 1;
			overflow-y: auto;
			margin-bottom: 20px;
			padding: 10px;
			background: #fafafa;
			border-radius: 8px;
		}
		
		.message {
			margin: 10px 0;
			display: flex;
			animation: slideIn 0.3s ease-out;
		}
		
		@keyframes slideIn {
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
		}
		
		.user-message .message-content {
			background: #667eea;
			color: white;
			border-radius: 12px;
			padding: 12px 16px;
			max-width: 70%;
			word-wrap: break-word;
			box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		}
		
		.ai-message {
			justify-content: flex-start;
		}
		
		.ai-message .message-content {
			background: white;
			color: #333;
			border-radius: 12px;
			padding: 12px 16px;
			max-width: 70%;
			word-wrap: break-word;
			border: 1px solid #e0e0e0;
			box-shadow: 0 2px 4px rgba(0,0,0,0.05);
		}
		
		.input-area {
			background: white;
			border-top: 1px solid #e0e0e0;
			padding: 15px;
			border-radius: 8px;
		}
		
		.chat-input-form {
			display: flex;
			gap: 10px;
		}
		
		.chat-input-form .input-group {
			display: flex;
			gap: 10px;
			width: 100%;
		}
		
		.chat-input-form textarea {
			resize: none;
			border: 1px solid #e0e0e0;
			border-radius: 4px;
			padding: 10px;
			font-family: inherit;
		}
		
		.chat-input-form button {
			align-self: flex-end;
			white-space: nowrap;
		}
		
		.spinner-border-sm {
			width: 0.875rem;
			height: 0.875rem;
			border-width: 0.15em;
		}
		
		@media (max-width: 768px) {
			.chat-sidebar {
				display: none;
			}
			
			.user-message .message-content,
			.ai-message .message-content {
				max-width: 90%;
			}
		}
	`;
	document.head.appendChild(style);
});
