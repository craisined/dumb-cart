import asyncio
import aioble
import bluetooth

DEVICE_NAME = "Smart Cart"  # Optional: set to None to skip name filtering.
SERVICE_UUID = bluetooth.UUID("12345678-1234-1234-1234-1234567890ab")
CHAR_UUID = bluetooth.UUID("12345678-1234-1234-1234-1234567890ac")

SCAN_TIMEOUT_MS = 10_000
CONNECT_TIMEOUT_MS = 10_000

async def find_device(timeout_ms=SCAN_TIMEOUT_MS):
	"""Scan for a peripheral by advertised name and/or service UUID."""
	print("Scanning for BLE peripheral...")

	async with aioble.scan(
		timeout_ms,
		interval_us=30_000,
		window_us=30_000,
		active=True,
	) as scanner:
		async for result in scanner:
			name = result.name()
			services = result.services()

			name_ok = (DEVICE_NAME is None) or (name == DEVICE_NAME)
			service_ok = (SERVICE_UUID is None) or (SERVICE_UUID in services)

			if name_ok and service_ok:
				print("Found:", name or "<no-name>", result.device)
				return result.device

	return None


async def notification_task(connection, characteristic):
	"""Listen for notifications until disconnected."""
	while connection.is_connected():
		data = await characteristic.notified()
		print("Notification:", data)


async def run_client():
	"""One connect/discover/use/disconnect cycle."""
	device = await find_device()
	if not device:
		print("No matching device found.")
		return

	print("Connecting...")
	try:
		connection = await device.connect(timeout_ms=CONNECT_TIMEOUT_MS)
	except Exception as exc:
		print("Connect failed:", exc)
		return

	async with connection:
		print("Connected")

		# Discover the service + characteristic you want to use.
		service = await connection.service(SERVICE_UUID)
		characteristic = await service.characteristic(CHAR_UUID)

		# Optional read.
		try:
			value = await characteristic.read()
			print("Initial read:", value)
		except Exception as exc:
			print("Read failed (can be normal if not readable):", exc)

		# Optional write.
		try:
			payload = b"hello"
			await characteristic.write(payload, response=True)
			print("Write OK:", payload)
		except Exception as exc:
			print("Write failed (can be normal if not writable):", exc)

		# Optional notifications.
		notify_runner = None
		try:
			await characteristic.subscribe(notify=True)
			print("Subscribed to notifications")
			notify_runner = asyncio.create_task(notification_task(connection, characteristic))
		except Exception as exc:
			print("Subscribe failed (can be normal if not notifiable):", exc)

		try:
			while connection.is_connected():
				await asyncio.sleep(1)
		finally:
			if notify_runner:
				notify_runner.cancel()


async def main():

	"""Reconnect loop."""

	while True:
		try:
			await run_client()
		except Exception as exc:
			print("Client error:", exc)

		print("Retrying in 3s...\n")
		await asyncio.sleep(3)


try:
	asyncio.run(main())
finally:
	asyncio.new_event_loop()
