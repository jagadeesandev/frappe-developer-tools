# Copyright (c) 2025, You and contributors
# For license information, please see license.txt

import frappe


def execute():
	"""Create AI Chat page in database"""
	
	# Check if page already exists
	if frappe.db.exists('Page', 'ai-chat'):
		print("Page 'ai-chat' already exists")
		return
	
	# Create the page
	page = frappe.get_doc({
		'doctype': 'Page',
		'name': 'ai-chat',
		'module': 'AI Module',
		'title': 'AI Chat',
		'standard': 1,
		'page_length': 0
	})
	
	page.insert()
	frappe.db.commit()
	print("✅ Page 'ai-chat' created successfully")
