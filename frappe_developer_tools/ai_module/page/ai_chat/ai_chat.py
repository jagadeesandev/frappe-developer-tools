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
	return context
