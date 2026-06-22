import { studentFormGroups } from "../../overrides/studentFormGroups.js";

export function createStudentGroups(students, formGroups = studentFormGroups) {
  const studentList = Array.isArray(students) ? students : [];
  const studentsById = new Map(studentList.map((student) => [Number(student.id), student]));
  const groupedStudentIds = new Set();
  const groups = [];

  Object.entries(formGroups ?? {}).forEach(([groupId, groupConfig]) => {
    const group = createOverrideGroup(groupId, groupConfig, studentsById);

    group.forms.forEach((form) => {
      groupedStudentIds.add(Number(form.formId));
    });

    if (group.forms.length > 0 || group.missingFormIds.length > 0) {
      groups.push(group);
    }
  });

  studentList.forEach((student) => {
    const studentId = Number(student.id);

    if (groupedStudentIds.has(studentId)) {
      return;
    }

    groups.push(createSingleStudentGroup(student));
  });

  return groups;
}

export function createStudentGroupIndexes(studentGroups) {
  const groups = Array.isArray(studentGroups) ? studentGroups : [];
  const groupsById = new Map();
  const groupByStudentId = new Map();

  groups.forEach((group) => {
    groupsById.set(group.groupId, group);

    group.forms.forEach((form) => {
      groupByStudentId.set(Number(form.formId), group);
    });
  });

  return {
    studentGroups: groups,
    studentGroupsById: groupsById,
    studentGroupByStudentId: groupByStudentId,
  };
}

function createOverrideGroup(groupId, groupConfig, studentsById) {
  const formIds = Array.isArray(groupConfig?.formIds) ? groupConfig.formIds : [];
  const forms = formIds
    .map((formId, index) => createForm(formId, groupConfig?.formNames?.[formId], index, studentsById))
    .filter(Boolean);
  const missingFormIds = formIds
    .map(Number)
    .filter((formId) => !studentsById.has(formId));
  const firstStudent = forms[0]?.student ?? null;

  return {
    groupId,
    name: groupConfig?.groupName ?? firstStudent?.name ?? groupId,
    forms,
    missingFormIds,
    needsReview: Boolean(groupConfig?.needsReview) || missingFormIds.length > 0 || forms.length !== formIds.length,
  };
}

function createSingleStudentGroup(student) {
  const groupId = `student-${student.id}`;

  return {
    groupId,
    name: student.name ?? groupId,
    forms: [
      {
        formId: student.id,
        formName: student.name ?? "기본 폼",
        student,
        order: 0,
      },
    ],
    missingFormIds: [],
    needsReview: false,
  };
}

function createForm(formId, formName, order, studentsById) {
  const studentId = Number(formId);
  const student = studentsById.get(studentId);

  if (!student) {
    return null;
  }

  return {
    formId: student.id,
    formName: formName ?? student.name ?? `폼 ${order + 1}`,
    student,
    order,
  };
}
