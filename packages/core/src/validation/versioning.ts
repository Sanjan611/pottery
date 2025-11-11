/**
 * Version utility functions
 */
export class VersionUtil {
  /**
   * Parse version string (e.g., "v1" -> 1)
   */
  static parseVersion(version: string): number {
    const num = parseInt(version.replace('v', ''), 10);
    if (isNaN(num)) {
      throw new Error(`Invalid version format: ${version}`);
    }
    return num;
  }

  /**
   * Increment version (e.g., "v1" -> "v2")
   */
  static incrementVersion(version: string): string {
    const num = this.parseVersion(version);
    return `v${num + 1}`;
  }

  /**
   * Compare versions
   * @returns negative if a < b, 0 if a == b, positive if a > b
   */
  static compareVersions(a: string, b: string): number {
    const numA = this.parseVersion(a);
    const numB = this.parseVersion(b);
    return numA - numB;
  }

  /**
   * Check if version is valid format
   */
  static isValidVersion(version: string): boolean {
    return /^v\d+$/.test(version);
  }
}
