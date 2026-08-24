import { Device } from "@/lib/models/device";
import { User } from "@/lib/models/user";
import { connectDb } from "@/lib/db";
import crypto from "crypto";

/**
 * Generate a device fingerprint hash from user agent and IP
 */
export function generateDeviceFingerprint(
  userAgent: string,
  ipAddress: string
): string {
  return crypto
    .createHash("sha256")
    .update(`${userAgent}:${ipAddress}`)
    .digest("hex");
}

/**
 * Get device name from user agent
 */
export function getDeviceName(userAgent: string): string {
  if (!userAgent) return "Unknown Device";

  if (userAgent.includes("Windows")) {
    if (userAgent.includes("Chrome")) return "Windows - Chrome";
    if (userAgent.includes("Firefox")) return "Windows - Firefox";
    if (userAgent.includes("Safari")) return "Windows - Safari";
    if (userAgent.includes("Edge")) return "Windows - Edge";
    return "Windows - Browser";
  }

  if (userAgent.includes("Mac")) {
    if (userAgent.includes("Chrome")) return "macOS - Chrome";
    if (userAgent.includes("Firefox")) return "macOS - Firefox";
    if (userAgent.includes("Safari")) return "macOS - Safari";
    return "macOS - Browser";
  }

  if (userAgent.includes("Linux")) {
    if (userAgent.includes("Chrome")) return "Linux - Chrome";
    if (userAgent.includes("Firefox")) return "Linux - Firefox";
    return "Linux - Browser";
  }

  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    return "iOS - Safari";
  }

  if (userAgent.includes("Android")) {
    return "Android - Chrome";
  }

  return "Unknown Device";
}

/**
 * Track a device login
 */
export async function trackDeviceLogin(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<{ isNewDevice: boolean; requiresVerification: boolean }> {
  try {
    await connectDb();

    const deviceName = getDeviceName(userAgent);
    // Find existing device
    const device = await Device.findOne({
      userId,
      ipAddress,
    });

    if (device) {
      // Update last used time
      device.lastUsed = new Date();
      await device.save();
      return {
        isNewDevice: false,
        requiresVerification: !device.isVerified,
      };
    }

    // Create new device entry
    const newDevice = new Device({
      userId,
      deviceName,
      ipAddress,
      userAgent,
      lastUsed: new Date(),
      isVerified: false,
    });

    await newDevice.save();

    // Send notification email for new device
    const user = await User.findById(userId);
    if (user) {
      // TODO: Send email notification about new device login
      // await sendNewDeviceNotification(user.email, deviceName, ipAddress);
    }

    return {
      isNewDevice: true,
      requiresVerification: true,
    };
  } catch (error) {
    console.error("Device tracking error:", error);
    return {
      isNewDevice: false,
      requiresVerification: false,
    };
  }
}

/**
 * Verify a device
 */
export async function verifyDevice(userId: string, ipAddress: string) {
  try {
    await connectDb();

    const device = await Device.findOne({ userId, ipAddress });
    if (device) {
      device.isVerified = true;
      await device.save();
    }
  } catch (error) {
    console.error("Device verification error:", error);
  }
}

/**
 * Get all devices for a user
 */
export async function getUserDevices(userId: string) {
  try {
    await connectDb();
    return await Device.find({ userId }).sort({ lastUsed: -1 });
  } catch (error) {
    console.error("Get user devices error:", error);
    return [];
  }
}

/**
 * Revoke a device
 */
export async function revokeDevice(userId: string, deviceId: string) {
  try {
    await connectDb();
    await Device.deleteOne({ _id: deviceId, userId });
  } catch (error) {
    console.error("Revoke device error:", error);
  }
}
