import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ComplaintAction,
  ComplaintStatus,
  CreateComplaintInput,
  CustomerComplaintInput,
} from "@/services/complaints.api";
import {
  createComplaintRequest,
  createMyComplaintRequest,
  fetchComplaints,
  fetchMyComplaints,
  transitionComplaintRequest,
} from "@/services/complaints.api";

export const complaintKeys = {
  all: ["complaints"] as const,
  list: (query: { status?: ComplaintStatus }) =>
    ["complaints", "list", query] as const,
  mine: ["complaints", "mine"] as const,
};

export function useComplaints(query: { status?: ComplaintStatus } = {}) {
  const normalized = { status: query.status };
  return useQuery({
    queryKey: complaintKeys.list(normalized),
    queryFn: () => fetchComplaints(normalized),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

function useInvalidateComplaints() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: complaintKeys.all });
  };
}

export function useCreateComplaint() {
  const invalidate = useInvalidateComplaints();
  return useMutation({
    mutationFn: (payload: CreateComplaintInput) =>
      createComplaintRequest(payload),
    onSuccess: invalidate,
  });
}

export function useTransitionComplaint() {
  const invalidate = useInvalidateComplaints();
  return useMutation({
    mutationFn: ({
      id,
      action,
      note,
    }: {
      id: string;
      action: ComplaintAction;
      note?: string;
    }) => transitionComplaintRequest(id, action, note),
    onSuccess: invalidate,
  });
}

// Customer self-service: the signed-in customer's own complaint list.
export function useMyComplaints(enabled = true) {
  return useQuery({
    queryKey: complaintKeys.mine,
    queryFn: fetchMyComplaints,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useCreateMyComplaint() {
  const invalidate = useInvalidateComplaints();
  return useMutation({
    mutationFn: (payload: CustomerComplaintInput) =>
      createMyComplaintRequest(payload),
    onSuccess: invalidate,
  });
}
