
export interface FilterSet {
  viewId: number;
  filters: Array<Filter>;
}

export interface Filter {
  name: string;
  icon?: string;
  groups: Array<FilterGroup>;
}

export interface FilterGroup {
  header: string;
  members: Array<FilterMember>;
}

export interface FilterMember {
  text: string;
  tags: Array<string>;
  active: boolean;
}
