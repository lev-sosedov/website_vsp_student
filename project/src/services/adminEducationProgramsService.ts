import {
  getDirections,
  getEducationPlanModules,
  getEducationPlans,
  getGroups,
  getModules,
  type AcademicDirection,
  type AcademicEducationPlan,
  type AcademicEducationPlanModule,
  type AcademicGroup,
  type AcademicModule,
} from '../api/academicApi';

export interface AdminProgramPlanModule {
  link: AcademicEducationPlanModule;
  module: AcademicModule | null;
}

export interface AdminProgramPlanItem {
  plan: AcademicEducationPlan;
  direction: AcademicDirection | null;
  modules: AdminProgramPlanModule[];
  groupCount: number;
}

export interface AdminProgramDirectionItem {
  direction: AcademicDirection;
  planCount: number;
  groupCount: number;
}

export interface AdminProgramModuleItem {
  module: AcademicModule;
  planCount: number;
}

export interface AdminEducationProgramsData {
  directions: AcademicDirection[];
  plans: AcademicEducationPlan[];
  modules: AcademicModule[];
  groups: AcademicGroup[];
  planItems: AdminProgramPlanItem[];
  directionItems: AdminProgramDirectionItem[];
  moduleItems: AdminProgramModuleItem[];
}

export const EMPTY_EDUCATION_PROGRAMS_DATA:
  AdminEducationProgramsData = {
    directions: [],
    plans: [],
    modules: [],
    groups: [],
    planItems: [],
    directionItems: [],
    moduleItems: [],
  };

export async function loadAdminEducationPrograms(): Promise<
  AdminEducationProgramsData
> {
  const [
    directions,
    plans,
    modules,
    groups,
  ] = await Promise.all([
    getDirections(),
    getEducationPlans(),
    getModules(),
    getGroups(),
  ]);

  const directionById = new Map(
    directions.map((direction) => [
      direction.id,
      direction,
    ])
  );
  const moduleById = new Map(
    modules.map((module) => [
      module.id,
      module,
    ])
  );

  const linksByPlanId = new Map<
    number,
    AcademicEducationPlanModule[]
  >();

  await Promise.all(
    plans.map(async (plan) => {
      const links =
        await getEducationPlanModules(
          plan.id
        );

      linksByPlanId.set(
        plan.id,
        [...links].sort(
          (first, second) =>
            first.order_number -
            second.order_number
        )
      );
    })
  );

  const planItems = plans
    .map(
      (plan): AdminProgramPlanItem => ({
        plan,
        direction:
          directionById.get(
            plan.direction_id
          ) ?? null,
        modules: (
          linksByPlanId.get(plan.id) ?? []
        ).map((link) => ({
          link,
          module:
            moduleById.get(
              link.module_id
            ) ?? null,
        })),
        groupCount: groups.filter(
          (group) =>
            group.education_plan_id ===
            plan.id
        ).length,
      })
    )
    .sort((first, second) =>
      first.plan.name.localeCompare(
        second.plan.name,
        'ru'
      )
    );

  const directionItems = directions
    .map(
      (
        direction
      ): AdminProgramDirectionItem => ({
        direction,
        planCount: plans.filter(
          (plan) =>
            plan.direction_id ===
            direction.id
        ).length,
        groupCount: groups.filter(
          (group) =>
            group.direction_id ===
            direction.id
        ).length,
      })
    )
    .sort((first, second) =>
      first.direction.name.localeCompare(
        second.direction.name,
        'ru'
      )
    );

  const moduleItems = modules
    .map(
      (module): AdminProgramModuleItem => ({
        module,
        planCount: planItems.filter(
          (planItem) =>
            planItem.modules.some(
              (item) =>
                item.link.module_id ===
                module.id
            )
        ).length,
      })
    )
    .sort((first, second) =>
      first.module.name.localeCompare(
        second.module.name,
        'ru'
      )
    );

  return {
    directions,
    plans,
    modules,
    groups,
    planItems,
    directionItems,
    moduleItems,
  };
}

