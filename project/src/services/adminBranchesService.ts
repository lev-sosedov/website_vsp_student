import {
  getBranchAddresses,
  getBranches,
  getGroupMembers,
  getGroups,
  type AcademicBranch,
  type AcademicBranchAddress,
  type AcademicGroup,
  type GroupMember,
} from '../api/academicApi';

export interface AdminBranchItem {
  branch: AcademicBranch;
  address: AcademicBranchAddress | null;
  groups: AcademicGroup[];
  groupCount: number;
  studentCount: number;
  teacherCount: number;
}

export interface AdminBranchesData {
  items: AdminBranchItem[];
  unusedAddresses: AcademicBranchAddress[];
}

export function getAdminBranchAddress(
  address: AcademicBranchAddress | null
): string {
  if (!address) {
    return 'Адрес не указан';
  }

  const explicitAddress =
    address.full_address?.trim() ||
    address.address?.trim();

  if (explicitAddress) {
    return explicitAddress;
  }

  return [
    address.country,
    address.city,
    address.street
      ? `ул. ${address.street}`
      : address.street_name
        ? `ул. ${address.street_name}`
        : null,
    address.house
      ? `дом ${address.house}`
      : null,
    address.building
      ? `корпус ${address.building}`
      : null,
    address.postal_code,
  ]
    .map((value) =>
      value === null || value === undefined
        ? ''
        : String(value).trim()
    )
    .filter(Boolean)
    .join(', ');
}

export function getAdminBranchTitle(
  item: Pick<
    AdminBranchItem,
    'branch' | 'address'
  >
): string {
  const legacyName =
    item.branch.name?.trim() ||
    item.branch.title?.trim() ||
    item.branch.short_name?.trim();

  if (legacyName) {
    return legacyName;
  }

  const city = item.address?.city?.trim();
  const street =
    item.address?.street?.trim() ||
    item.address?.street_name?.trim();

  if (city && street) {
    return `${city}, ${street}`;
  }

  return city || `Филиал №${item.branch.id}`;
}

function isActiveMembership(
  membership: GroupMember
): boolean {
  return (
    membership.is_active &&
    membership.left_at === null
  );
}

export async function loadAdminBranches(): Promise<
  AdminBranchesData
> {
  const [branches, addresses, groups] =
    await Promise.all([
      getBranches(false),
      getBranchAddresses(),
      getGroups(),
    ]);

  const membershipResults =
    await Promise.allSettled(
      groups.map((group) =>
        getGroupMembers(group.id)
      )
    );

  const membershipsByGroupId = new Map<
    number,
    GroupMember[]
  >(
    groups.map((group, index) => [
      group.id,
      membershipResults[index].status ===
      'fulfilled'
        ? membershipResults[index].value
        : [],
    ])
  );

  const addressById = new Map(
    addresses.map((address) => [
      address.id,
      address,
    ])
  );

  const groupsByBranchId = new Map<
    number,
    AcademicGroup[]
  >();

  groups.forEach((group) => {
    if (!group.branch_id) {
      return;
    }

    const branchGroups =
      groupsByBranchId.get(group.branch_id) ??
      [];

    branchGroups.push(group);
    groupsByBranchId.set(
      group.branch_id,
      branchGroups
    );
  });

  const items = branches
    .map((branch): AdminBranchItem => {
      const branchGroups =
        groupsByBranchId.get(branch.id) ?? [];

      const studentIds = new Set<number>();
      const teacherIds = new Set<number>();

      branchGroups.forEach((group) => {
        const memberships =
          membershipsByGroupId.get(group.id) ??
          [];

        memberships
          .filter(isActiveMembership)
          .forEach((membership) => {
            const role =
              membership.role.toLowerCase();

            if (role === 'student') {
              studentIds.add(
                membership.user_id
              );
            }

            if (
              role === 'teacher' ||
              role === 'assistant'
            ) {
              teacherIds.add(
                membership.user_id
              );
            }
          });
      });

      return {
        branch,
        address:
          addressById.get(
            branch.branch_address_id ??
              branch.address_id ??
              -1
          ) ?? null,
        groups: branchGroups,
        groupCount: branchGroups.length,
        studentCount: studentIds.size,
        teacherCount: teacherIds.size,
      };
    })
    .sort((first, second) =>
      getAdminBranchTitle(first).localeCompare(
        getAdminBranchTitle(second),
        'ru'
      )
    );

  const usedAddressIds = new Set(
    branches
      .map(
        (branch) =>
          branch.branch_address_id ??
          branch.address_id
      )
      .filter(
        (addressId): addressId is number =>
          typeof addressId === 'number'
      )
  );

  return {
    items,
    unusedAddresses: addresses.filter(
      (address) =>
        !usedAddressIds.has(address.id)
    ),
  };
}
