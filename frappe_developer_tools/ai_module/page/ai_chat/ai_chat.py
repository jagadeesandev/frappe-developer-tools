# Copyright (c) 2025, You and contributors
# For license information, please see license.txt

import frappe


def get_context(context):
	"""Get context for AI Chat page"""
	# Check if user is authenticated
	if not frappe.session.user or frappe.session.user == 'Guest':
		frappe.throw('Login required to access AI Chat', frappe.PermissionError)
	
	context.no_cache = 1
	context.title = 'AI Chat'
	
	# Get recent chats for the user
	try:
		recent_chats = frappe.db.get_list(
			'AI Chat',
			filters={'user': frappe.session.user},
			fields=['name', 'title', 'modified'],
			order_by='modified desc',
			limit_page_length=10
		)
		context.recent_chats = recent_chats
	except Exception:
		# If AI Chat doctype doesn't exist yet, just set empty list
		context.recent_chats = []
	
	return context
