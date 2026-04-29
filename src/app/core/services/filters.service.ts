import { Injectable, signal } from '@angular/core';
import { FormatDate } from "../functions/formatDate";

@Injectable({
  providedIn: 'root'
})
export abstract class FiltersService {
  hasChanged = signal<boolean>(false);
  loading = signal<boolean>(true);
  search = signal<string>('');
  page = signal<number>(1);
  limit = signal<number>(15);
  currentPage = signal<number>(1);
  taskStatus = signal<any>([]);
  taskType = signal<any>([]);
  priority = signal<any>([]);
  rated = signal<any>(null);
  isOverdue = signal<any>(null);
  dateFrom = signal<any>(null);
  dateTo = signal<any>(null);
  walletFrom = signal<any>(null);
  walletTo = signal<any>(null);
  orderKey = signal<any>(0);
  orderDirection = signal<any>(0);
  voteStatus = signal<any>([]);
  voteCanceled = signal<any>(null);
  creators = signal<any>([]);
  assignees = signal<any>([]);
  department = signal<any>([]);
  assigneeState = signal<any>(null);
  rateValue = signal<any>([]);
  managers = signal<any>([]);
  type = signal<any>(null);
  meta = signal<any>(null);
  balanceMeta = signal<any>(null);
  amountFrom = signal<any>(null);
  amountTo = signal<any>(null);
  transactionType = signal<any>(null);
  sessionStatus = signal<any>(null);
  role = signal<any>(null);
  attendanceType = signal<any>(null);
  project = signal<any>([]);
  repeatPeriod = signal<any>(null);

  protected constructor() {
  }

  params(url: any, type?: string) {
    this.getSearch(url);
    this.getPage(url);
    this.getLimit(url);
    this.getTaskStatus(url);
    this.getTaskType(url);
    this.getPriority(url);
    this.getRated(url);
    this.getOverdue(url);
    this.getSort(url, type);
    this.getVoteStatus(url);
    this.getVoteCanceled(url);
    this.getCreator(url);
    this.getAssignee(url);
    this.getDepartments(url, type);
    this.getAssigneeState(url, type);
    this.getDateFrom(url, type);
    this.getDateTo(url, type);
    this.isRatedWithValue(url);
    this.getManager(url, type);
    this.getRole(url);
    this.getAttendnaceType(url);
    this.getProjects(url);
    this.getRepeatPeroid(url)


    this.getWalletType(url);
    this.getAmount(url);
    this.getTransactionType(url);
    this.getSessionStatus(url);
    this.getWalletFrom(url);
    this.getWalletTo(url);
  }

  getTransactionType(url: any) {
    typeof (this.transactionType()) == 'number' && url.searchParams.append('FilterType', this.transactionType())
  }

  getAmount(url: any) {
    this.amountFrom() && url.searchParams.append('AmountFrom', this.amountFrom())
    this.amountTo() && url.searchParams.append('AmountTo', this.amountTo())
  }

  getWalletType(url: any) {
    typeof (this.type()) === 'number' && url.searchParams.append('PaymentType', this.type())
  }

  getPage(url: any) {
    url.searchParams.append('page', String(this.page()))
  }

  getLimit(url: any) {
    url.searchParams.append('limit', String(this.limit()))
  }

  getSearch(url: any) {
    this.search() && url.searchParams.append('search', this.search())
  }


  getTaskStatus(url: any) {
    this.taskStatus().length > 0 && this.taskStatus().forEach((status: number) => {
      url.searchParams.append('states', String(status))
    })
  }

  getTaskType(url: any) {
    this.taskType().length > 0 && this.taskType().forEach((status: number) => {
      url.searchParams.append('TaskGroupType', String(status))
    })
  }

  getPriority(url: any) {
    this.priority().length > 0 && this.priority().forEach((status: number) => {
      url.searchParams.append('priorities', String(status))
    })
  }

  getRated(url: any) {
    typeof this.rated() == 'boolean' && url.searchParams.append('isRated', this.rated())
  }

  getOverdue(url: any) {
    typeof this.isOverdue() == 'boolean' && url.searchParams.append('isOverDue', this.isOverdue())
  }

  getDateFrom(url: any, type?: string) {
    this.dateFrom() && url.searchParams.append(type == 'all-users' ? 'creationDateFrom' : type == 'users-attendance' ? 'dateFrom' : type == 'team-balance' ? 'from' : 'startDateFrom', FormatDate(this.dateFrom()))
  }

  getDateTo(url: any, type?: string) {
    this.dateTo() && url.searchParams.append(type == 'all-users' ? 'creationDateTo' : type == 'users-attendance' ? 'dateTo' : type == 'team-balance' ? 'to' : 'startDateTo', FormatDate(this.dateTo()) || '')
  }

  getCreator(url: any) {
    this.creators().length > 0 && this.creators().forEach((creator: any) => {
      url.searchParams.append('creators', creator.id)
    })
  }

  getAssignee(url: any) {
    this.assignees().length > 0 && this.assignees().forEach((assignees: any) => {
      url.searchParams.append('assignees', assignees.id)
    })
  }

  getDepartments(url: any, type?: string) {
    this.department().length > 0 && this.department().forEach((department: any) => {
      url.searchParams.append(type == 'all-tasks' ? 'assigneeDepartments' : type == 'users-attendance' ? 'employeeDepartments' :type == 'team-balance' ? 'departmentsId' : 'departments', department)
    })
  }

  getAssigneeState(url: any, type?: string) {
    typeof this.assigneeState() == 'boolean' && url.searchParams.append(type == 'all-tasks' ? 'assigneeIsActive' : 'isActive', this.assigneeState())
  }

  isRatedWithValue(url: any) {
    this.rateValue().length > 0 && url.searchParams.append('isRated', 'true');
    this.rateValue().length > 0 && this.rateValue().map((value: any) => {
      url.searchParams.append('rate', value)
    })
  }

  getManager(url: any, type?: string) {
    this.managers().length > 0 && this.managers().forEach((manager: any) => {
      url.searchParams.append(type == 'users-attendance' ? 'employeeManagers' : type == 'team-balance'?'managersIdsId': 'managers', manager.id)
    })
  }

  getRole(url: any) {
    this.role() && url.searchParams.append('roleId', this.role())
  }

  getAttendnaceType(url: any) {
    this.attendanceType() && url.searchParams.append('attendanceStatus', this.attendanceType())
  }

  getProjects(url: any) {
    this.project().length > 0 && this.project().forEach((project: any) => {
      url.searchParams.append('projectIds', project)
    })
  }

  getRepeatPeroid(url: any) {
    if (this.repeatPeriod() == 6) {
      url.searchParams.append('isRepeated', false);
    } else if (this.repeatPeriod() == 7) {
      url.searchParams.append('isRepeated', true);
      url.searchParams.append('taskStopedRepeated', 1);
    } else {
      this.repeatPeriod() && url.searchParams.append('isRepeated', true);
      this.repeatPeriod() && url.searchParams.append('taskRepeatedPeriod', [this.repeatPeriod()])
    }
  }


  getWalletFrom(url: any) {
    this.walletFrom() && url.searchParams.append('creationDateFrom', FormatDate(this.walletFrom()))
  }

  getWalletTo(url: any) {
    this.walletTo() && url.searchParams.append('creationDateTo', FormatDate(this.walletTo()) || '')
  }

  getSort(url: URL, type?: string) {
    if (type !== 'report-table') {
      url.searchParams.append('OrderKey', String(this.orderKey()));
    } else {
      this.orderKey().length > 0 && this.orderKey().forEach((key: any, i: any) => {
        url.searchParams.append('orderKey' + (i + 1), key)
      });
    }
    url.searchParams.append('OrderDirection', String(this.orderDirection()));
  }

  getVoteStatus(url: any) {
    this.voteStatus().length > 0 && this.voteStatus().forEach((status: number) => {
      url.searchParams.append('voteStates', String(status))
    })
  }

  getVoteCanceled(url: any) {
    this.voteCanceled() && url.searchParams.append('voteFormStates', this.voteCanceled())
  }

  getSessionStatus(url: any) {
    // this.sessionStatus().length > 0 && this.sessionStatus().forEach((status: number) => {
    //   url.searchParams.append('sessionAttendeeStatues', String(status))
    // })
    this.sessionStatus() && url.searchParams.append('sessionAttendeeStatues', this.sessionStatus())

  }

  setMeta(res: any) {
    let meta = {
      pageSize: res.data.pageSize,
      totalItems: res.data.totalItems,
      totalPages: res.data.totalPages,
      totalUnSeen: res.data.totalUnSeen,
      currentPage: res.data.currentPage
    }
    this.meta.set(meta)
    this.currentPage.set(meta.currentPage)
  }
  setBalanceMeta(res: any) {
    let balanceMeta = {
      pageSize: res.data.pagedModel.pageSize,
      totalItems: res.data.pagedModel.totalItems,
      totalPages: res.data.pagedModel.totalPages,
      totalUnSeen: res.data.pagedModel.totalUnSeen,
      currentPage: res.data.pagedModel.currentPage
    }
    this.balanceMeta.set(balanceMeta)
    this.currentPage.set(balanceMeta.currentPage)
  }

  filter() {
    this.page.set(1);
    this.hasChanged.set(true);
  }

  resetFilter() {
    this.search.set('');
    this.page.set(1);
    this.limit.set(15);
    this.currentPage.set(1);
    this.rated.set(null);
    this.isOverdue.set(null);
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.walletFrom.set(null);
    this.walletTo.set(null);
    this.orderKey.set(0);
    this.orderDirection.set(0);
    this.voteCanceled.set(null);
    this.assigneeState.set(null);
    this.type.set(null);
    this.meta.set(null);
    this.amountFrom.set(null);
    this.amountTo.set(null);
    this.transactionType.set(null);
    this.sessionStatus.set(null);
    this.role.set(null);
    this.attendanceType.set(null);
    this.taskStatus.set([]);
    this.taskType.set([]);
    this.priority.set([]);
    this.voteStatus.set([]);
    this.creators.set([]);
    this.assignees.set([]);
    this.department.set([]);
    this.rateValue.set([]);
    this.managers.set([]);
    this.project.set([]);
  }
}
