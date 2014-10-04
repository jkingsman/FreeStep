FreeStep Test Plan

1. Join
	1. Join prevented when
		1. Nickname < 2 chars
			1. Error Displayed
		2. Roomname < 2 chars
			1. Error displayed
	3. Join allowed otherwise
4. Room
	1. Room title displayed correctly
	2. Join message displayed correctly
	3. User is listed under Members
4. Solo Messaging
	1. A blank message cannot be sent
	1. Send a message
		1. Sound is made
		1. Own message shows as blue, with date and name
		2. Timestamps can be toggled
	3. Disable sound and send a message
		1. No noise is made
	2. Send a picture
		1. The picture is encoded and displayed correctly
		1. Send another immediately
			1. Rate limited
		2. Send one that's too large
			1. Size error
		2. Disable image receipt
			1. Send image
				1. Image is not displayed
2. Group messaging
	1. Join a room with the same nick as another person in the room
		1. Join denied
	2. Join allowed otherwise
	1. Typing indicators work correctly
	2. Verify Solo Messaging 2-4 for others
1. Mobile
	1. FIle upload box appears on mobile