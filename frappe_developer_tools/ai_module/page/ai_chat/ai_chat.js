frappe.pages['ai-chat'].on_page_load = function(wrapper) {
	let page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'AI Chat',
		single_column: true
	});

	// Create Vue app container
	const container = document.createElement('div');
	container.id = 'ai-chat-vue-app';
	page.main.appendChild(container);

	// Import and mount Vue component
	frappe.require('assets/frappe_developer_tools/js/ai_chat_page.js', function() {
		// Vue component will be mounted by the JS file
	});
};
