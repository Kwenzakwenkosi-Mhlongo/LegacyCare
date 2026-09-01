// File: app/(clerk)/appointments/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiRequest } from "../../../services/api";
import Colors from "../../../src/theme/colors";

type Appointment = {
  appointmentId: number;
  serviceRequestId: number;

  clientId: string;
  branchId: string;

  appointmentType: string;

  preferredDateTime: string;
  confirmedDateTime?: string | null;

  status: string;
  priority: string;

  clientNotes?: string | null;
  clerkNotes?: string | null;

  assignedStaffId?: string | null;

  rescheduleReason?: string | null;
  cancellationReason?: string | null;

  createdDate: string;
  updatedDate: string;

  confirmedDate?: string | null;
  completedDate?: string | null;
  cancelledDate?: string | null;

  branch?: {
    branchId?: string | null;
    branchName?: string | null;
    address?: string | null;
  } | null;

  assignedStaff?: Staff | null;
};

type Staff = {
  staffId: string;
  staffRole?: string | null;

  user?: {
    userId?: string | null;
    fullName?: string | null;
    email?: string | null;
  } | null;
};

type ReviewAction =
  | "Confirm"
  | "Reschedule"
  | "Complete"
  | "Cancel"
  | "NoShow";

type ReviewRequest = {
  action: ReviewAction;
  confirmedDateTime?: string | null;
  assignedStaffId?: string | null;
  clerkNotes?: string | null;
  reason?: string | null;
};

function normalize(
  value?: string | null
): string {
  return (value || "")
    .trim()
    .toLowerCase();
}

function formatStatus(
  value?: string | null
): string {
  const status =
    normalize(value);

  if (
    status === "noshow" ||
    status === "no show"
  ) {
    return "No Show";
  }

  return value || "Unknown";
}

function formatDateTime(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
  }

  return date.toLocaleString(
    "en-ZA",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function toLocalInputValue(
  value?: string | null
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const pad =
    (number: number): string =>
      String(number).padStart(
        2,
        "0"
      );

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())} ` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  );
}

function parseDateTimeInput(
  value: string
): Date | null {
  const match =
    value
      .trim()
      .match(
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/
      );

  if (!match) {
    return null;
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
  ] = match;

  const numericYear =
    Number(year);

  const numericMonth =
    Number(month);

  const numericDay =
    Number(day);

  const numericHour =
    Number(hour);

  const numericMinute =
    Number(minute);

  const date =
    new Date(
      numericYear,
      numericMonth - 1,
      numericDay,
      numericHour,
      numericMinute,
      0,
      0
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  if (
    date.getFullYear() !==
      numericYear ||
    date.getMonth() !==
      numericMonth - 1 ||
    date.getDate() !==
      numericDay ||
    date.getHours() !==
      numericHour ||
    date.getMinutes() !==
      numericMinute
  ) {
    return null;
  }

  return date;
}

export default function AppointmentDetailsScreen() {
  const router =
    useRouter();

  const insets =
    useSafeAreaInsets();

  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const rawId =
    params.id;

  const appointmentId =
    Array.isArray(rawId)
      ? rawId[0]
      : rawId;

  const [
    appointment,
    setAppointment,
  ] =
    useState<
      Appointment | null
    >(null);

  const [
    availableStaff,
    setAvailableStaff,
  ] =
    useState<Staff[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadingStaff,
    setLoadingStaff,
  ] =
    useState(false);

  const [
    processing,
    setProcessing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    actionModal,
    setActionModal,
  ] =
    useState<
      ReviewAction | null
    >(null);

  const [
    selectedStaffId,
    setSelectedStaffId,
  ] =
    useState("");

  const [
    confirmedDateTime,
    setConfirmedDateTime,
  ] =
    useState("");

  const [
    clerkNotes,
    setClerkNotes,
  ] =
    useState("");

  const [
    reason,
    setReason,
  ] =
    useState("");

  const handleBack =
    (): void => {
      Keyboard.dismiss();

      if (
        router.canGoBack()
      ) {
        router.back();

        return;
      }

      router.replace(
        "/(clerk)/appointments" as never
      );
    };

  const loadAppointment =
    useCallback(
      async (): Promise<void> => {
        if (
          !appointmentId
        ) {
          setError(
            "Appointment ID is missing."
          );

          setLoading(false);

          return;
        }

        try {
          setError("");

          const data =
            await apiRequest<Appointment>(
              `/Appointment/clerk/${appointmentId}`
            );

          setAppointment(
            data
          );

          setSelectedStaffId(
            data.assignedStaffId ||
              ""
          );

          setConfirmedDateTime(
            toLocalInputValue(
              data.confirmedDateTime ||
                data.preferredDateTime
            )
          );

          setClerkNotes(
            data.clerkNotes ||
              ""
          );
        } catch (err) {
          console.log(
            "[APPOINTMENT DETAILS] ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load appointment."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        appointmentId,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      void loadAppointment();

      return undefined;
    }, [
      loadAppointment,
    ])
  );

  const loadAvailableStaff =
    useCallback(
      async (
        dateTime?: string
      ): Promise<void> => {
        if (
          !appointmentId
        ) {
          return;
        }

        try {
          setLoadingStaff(
            true
          );

          let path =
            `/Appointment/clerk/${appointmentId}/available-staff`;

          if (dateTime) {
            path +=
              `?appointmentDateTime=${encodeURIComponent(
                dateTime
              )}`;
          }

          const data =
            await apiRequest<
              Staff[]
            >(
              path
            );

          setAvailableStaff(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (err) {
          console.log(
            "[AVAILABLE STAFF] ERROR:",
            err
          );

          setAvailableStaff(
            []
          );

          Alert.alert(
            "Available Staff",
            err instanceof Error
              ? err.message
              : "Unable to load available staff."
          );
        } finally {
          setLoadingStaff(
            false
          );
        }
      },
      [
        appointmentId,
      ]
    );

  const openAction =
    async (
      action: ReviewAction
    ): Promise<void> => {
      Keyboard.dismiss();

      setActionModal(
        action
      );

      setReason("");

      if (
        action === "Confirm" ||
        action === "Reschedule"
      ) {
        const date =
          appointment
            ?.confirmedDateTime ||
          appointment
            ?.preferredDateTime;

        setConfirmedDateTime(
          toLocalInputValue(
            date
          )
        );

        if (date) {
          await loadAvailableStaff(
            new Date(
              date
            ).toISOString()
          );
        }
      }
    };

  const closeAction =
    (): void => {
      if (
        processing
      ) {
        return;
      }

      Keyboard.dismiss();

      setActionModal(
        null
      );

      setReason("");
    };

  const submitReview =
    async (): Promise<void> => {
      if (
        !appointment ||
        !actionModal
      ) {
        return;
      }

      Keyboard.dismiss();

      const completedAction =
        actionModal;

      const request:
        ReviewRequest = {
          action:
            completedAction,

          clerkNotes:
            clerkNotes.trim() ||
            null,
        };

      if (
        completedAction === "Confirm" ||
        completedAction === "Reschedule"
      ) {
        const parsedDate =
          parseDateTimeInput(
            confirmedDateTime
          );

        if (
          !parsedDate
        ) {
          Alert.alert(
            "Invalid Date",
            "Use the format YYYY-MM-DD HH:mm."
          );

          return;
        }

        if (
          parsedDate.getTime() <=
          Date.now()
        ) {
          Alert.alert(
            "Invalid Date",
            "The appointment date and time must be in the future."
          );

          return;
        }

        if (
          !selectedStaffId
        ) {
          Alert.alert(
            "Staff Required",
            "Select an available staff member."
          );

          return;
        }

        request.confirmedDateTime =
          parsedDate.toISOString();

        request.assignedStaffId =
          selectedStaffId;

        if (
          completedAction ===
          "Reschedule"
        ) {
          if (
            !reason.trim()
          ) {
            Alert.alert(
              "Reason Required",
              "Enter a reason for rescheduling the appointment."
            );

            return;
          }

          request.reason =
            reason.trim();
        }
      }

      if (
        completedAction ===
        "Cancel"
      ) {
        if (
          !reason.trim()
        ) {
          Alert.alert(
            "Reason Required",
            "Enter a cancellation reason."
          );

          return;
        }

        request.reason =
          reason.trim();
      }

      try {
        setProcessing(true);

        await apiRequest<Appointment>(
          `/Appointment/clerk/${appointment.appointmentId}/review`,
          {
            method: "PUT",

            body:
              JSON.stringify(
                request
              ),
          }
        );

        setActionModal(
          null
        );

        setReason("");

        await loadAppointment();

        let successMessage =
          "Appointment updated successfully.";

        switch (
          completedAction
        ) {
          case "Confirm":
            successMessage =
              "Appointment confirmed successfully.";
            break;

          case "Reschedule":
            successMessage =
              "Appointment rescheduled successfully.";
            break;

          case "Complete":
            successMessage =
              "Appointment marked as completed.";
            break;

          case "Cancel":
            successMessage =
              "Appointment cancelled successfully.";
            break;

          case "NoShow":
            successMessage =
              "Appointment marked as No Show.";
            break;
        }

        Alert.alert(
          "Success",
          successMessage
        );
      } catch (err) {
        console.log(
          "[APPOINTMENT REVIEW] ERROR:",
          err
        );

        Alert.alert(
          "Unable to Update",
          err instanceof Error
            ? err.message
            : "Unable to update appointment."
        );
      } finally {
        setProcessing(false);
      }
    };

  const status =
    normalize(
      appointment?.status
    );

  const isClosed =
    [
      "completed",
      "cancelled",
      "noshow",
      "no show",
    ].includes(
      status
    );

  const canConfirm =
    status === "requested" ||
    status === "rescheduled";

  const canReschedule =
    status === "requested" ||
    status === "confirmed" ||
    status === "rescheduled";

  const canComplete =
    status === "confirmed" ||
    status === "rescheduled";

  const selectedStaff =
    useMemo(
      () =>
        availableStaff.find(
          (staff) =>
            staff.staffId ===
            selectedStaffId
        ),
      [
        availableStaff,
        selectedStaffId,
      ]
    );

  if (loading) {
    return (
      <LinearGradient
        colors={[
          Colors.primary,
          Colors.secondary,
        ]}
        style={
          styles.container
        }
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={
            Colors.primary
          }
        />

        <View
          style={
            styles.center
          }
        >
          <ActivityIndicator
            size="large"
            color={
              Colors.gold
            }
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading appointment...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (
    error ||
    !appointment
  ) {
    return (
      <LinearGradient
        colors={[
          Colors.primary,
          Colors.secondary,
        ]}
        style={
          styles.container
        }
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={
            Colors.primary
          }
        />

        <View
          style={[
            styles.errorPage,
            {
              paddingTop:
                Math.max(
                  insets.top,
                  12
                ),
            },
          ]}
        >
          <View
            style={
              styles.fixedHeader
            }
          >
            <TouchableOpacity
              style={
                styles.backButton
              }
              activeOpacity={
                0.8
              }
              onPress={
                handleBack
              }
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={
                  Colors.white
                }
              />
            </TouchableOpacity>

            <View
              style={
                styles.headerText
              }
            >
              <Text
                style={
                  styles.fixedHeaderTitle
                }
              >
                Appointment
              </Text>
            </View>

            <Text
              style={
                styles.brandText
              }
            >
              LegacyCare
            </Text>
          </View>

          <View
            style={
              styles.errorCard
            }
          >
            <Text
              style={
                styles.errorText
              }
            >
              {error ||
                "Appointment could not be loaded."}
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[
        Colors.primary,
        Colors.secondary,
      ]}
      style={
        styles.container
      }
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={
          Colors.primary
        }
      />

      <View
        style={[
          styles.fixedHeader,
          {
            paddingTop:
              Math.max(
                insets.top,
                12
              ),
          },
        ]}
      >
        <TouchableOpacity
          style={
            styles.backButton
          }
          activeOpacity={
            0.8
          }
          onPress={
            handleBack
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={
              Colors.white
            }
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerText
          }
        >
          <Text
            style={
              styles.fixedHeaderTitle
            }
          >
            Appointment
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            REQ-
            {String(
              appointment.serviceRequestId
            ).padStart(
              5,
              "0"
            )}
          </Text>
        </View>

        <Text
          style={
            styles.brandText
          }
        >
          LegacyCare
        </Text>
      </View>

      <KeyboardAvoidingView
        style={
          styles.keyboardView
        }
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
        }
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={
            styles.scrollView
          }
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                120 +
                insets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
          onScrollBeginDrag={() => {
            Keyboard.dismiss();
          }}
          scrollEnabled
          nestedScrollEnabled
        >
          <View
            style={
              styles.statusCard
            }
          >
            <Text
              style={
                styles.appointmentType
              }
            >
              {
                appointment.appointmentType
              }
            </Text>

            <Text
              style={
                styles.statusLabel
              }
            >
              {formatStatus(
                appointment.status
              )}
            </Text>

            <Text
              style={
                styles.priority
              }
            >
              {
                appointment.priority
              }{" "}
              Priority
            </Text>
          </View>

          <Section
            title="Appointment Information"
          >
            <DetailRow
              label="Preferred Date"
              value={
                formatDateTime(
                  appointment.preferredDateTime
                )
              }
            />

            <DetailRow
              label="Confirmed Date"
              value={
                appointment.confirmedDateTime
                  ? formatDateTime(
                      appointment.confirmedDateTime
                    )
                  : "Not confirmed yet"
              }
            />

            <DetailRow
              label="Branch"
              value={
                appointment.branch
                  ?.branchName ||
                appointment.branchId
              }
            />

            <DetailRow
              label="Assigned Staff"
              value={
                appointment
                  .assignedStaff
                  ?.user
                  ?.fullName ||
                appointment.assignedStaffId ||
                "Not assigned"
              }
            />

            <DetailRow
              label="Staff Role"
              value={
                appointment
                  .assignedStaff
                  ?.staffRole ||
                "Not available"
              }
            />

            <DetailRow
              label="Submitted"
              value={
                formatDateTime(
                  appointment.createdDate
                )
              }
            />
          </Section>

          {appointment.clientNotes ? (
            <Section
              title="Client Notes"
            >
              <Text
                style={
                  styles.notesText
                }
              >
                {
                  appointment.clientNotes
                }
              </Text>
            </Section>
          ) : null}

          {appointment.clerkNotes ||
          appointment.rescheduleReason ||
          appointment.cancellationReason ? (
            <Section
              title="LegacyCare Notes"
            >
              {appointment.clerkNotes ? (
                <DetailRow
                  label="Clerk Notes"
                  value={
                    appointment.clerkNotes
                  }
                />
              ) : null}

              {appointment.rescheduleReason ? (
                <DetailRow
                  label="Reschedule Reason"
                  value={
                    appointment.rescheduleReason
                  }
                />
              ) : null}

              {appointment.cancellationReason ? (
                <DetailRow
                  label="Cancellation Reason"
                  value={
                    appointment.cancellationReason
                  }
                />
              ) : null}
            </Section>
          ) : null}

          {!isClosed ? (
            <View
              style={
                styles.actionsSection
              }
            >
              <Text
                style={
                  styles.actionsTitle
                }
              >
                Clerk Actions
              </Text>

              {canConfirm ? (
                <ActionButton
                  title="Confirm Appointment"
                  icon="checkmark-circle-outline"
                  onPress={() =>
                    void openAction(
                      "Confirm"
                    )
                  }
                />
              ) : null}

              {canReschedule ? (
                <ActionButton
                  title="Reschedule"
                  icon="calendar-outline"
                  onPress={() =>
                    void openAction(
                      "Reschedule"
                    )
                  }
                />
              ) : null}

              {canComplete ? (
                <ActionButton
                  title="Mark Completed"
                  icon="checkmark-done-outline"
                  onPress={() =>
                    void openAction(
                      "Complete"
                    )
                  }
                />
              ) : null}

              <ActionButton
                title="Cancel Appointment"
                icon="close-circle-outline"
                danger
                onPress={() =>
                  void openAction(
                    "Cancel"
                  )
                }
              />

              {canComplete ? (
                <ActionButton
                  title="Mark No Show"
                  icon="person-remove-outline"
                  danger
                  onPress={() =>
                    void openAction(
                      "NoShow"
                    )
                  }
                />
              ) : null}
            </View>
          ) : (
            <View
              style={
                styles.closedCard
              }
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={
                  Colors.textMuted
                }
              />

              <Text
                style={
                  styles.closedText
                }
              >
                This appointment is closed and can no longer be changed.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={
          actionModal !==
          null
        }
        transparent
        animationType="slide"
        onRequestClose={
          closeAction
        }
      >
        <KeyboardAvoidingView
          style={
            styles.modalKeyboardView
          }
          behavior={
            Platform.OS ===
            "ios"
              ? "padding"
              : undefined
          }
        >
          <Pressable
            style={
              styles.modalOverlay
            }
            onPress={
              Keyboard.dismiss
            }
          >
            <Pressable
              style={[
                styles.modalCard,
                {
                  paddingBottom:
                    Math.max(
                      insets.bottom,
                      18
                    ),
                },
              ]}
              onPress={() => {
                Keyboard.dismiss();
              }}
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {actionModal ===
                  "NoShow"
                    ? "Mark No Show"
                    : `${actionModal} Appointment`}
                </Text>

                <TouchableOpacity
                  style={
                    styles.modalCloseButton
                  }
                  activeOpacity={0.8}
                  onPress={
                    closeAction
                  }
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={
                      Colors.white
                    }
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={
                  Platform.OS === "ios"
                    ? "interactive"
                    : "on-drag"
                }
                onScrollBeginDrag={() => {
                  Keyboard.dismiss();
                }}
              >
                {actionModal ===
                  "Confirm" ||
                actionModal ===
                  "Reschedule" ? (
                  <>
                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Appointment Date & Time
                    </Text>

                    <TextInput
                      value={
                        confirmedDateTime
                      }
                      onChangeText={
                        setConfirmedDateTime
                      }
                      placeholder="YYYY-MM-DD HH:mm"
                      placeholderTextColor={
                        Colors.textMuted
                      }
                      style={
                        styles.input
                      }
                      autoCapitalize="none"
                      autoCorrect={
                        false
                      }
                      returnKeyType="done"
                      onSubmitEditing={
                        Keyboard.dismiss
                      }
                    />

                    <Text
                      style={
                        styles.inputHint
                      }
                    >
                      Example: 2026-09-10 14:00
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.loadStaffButton,
                        loadingStaff &&
                          styles.disabledButton,
                      ]}
                      disabled={
                        loadingStaff
                      }
                      activeOpacity={0.8}
                      onPress={() => {
                        Keyboard.dismiss();

                        const parsed =
                          parseDateTimeInput(
                            confirmedDateTime
                          );

                        if (!parsed) {
                          Alert.alert(
                            "Invalid Date",
                            "Use YYYY-MM-DD HH:mm."
                          );

                          return;
                        }

                        if (
                          parsed.getTime() <=
                          Date.now()
                        ) {
                          Alert.alert(
                            "Invalid Date",
                            "The appointment date and time must be in the future."
                          );

                          return;
                        }

                        void loadAvailableStaff(
                          parsed.toISOString()
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.loadStaffText
                        }
                      >
                        {loadingStaff
                          ? "Loading Staff..."
                          : "Check Available Staff"}
                      </Text>
                    </TouchableOpacity>

                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Assigned Staff
                    </Text>

                    {availableStaff.length ===
                    0 ? (
                      <Text
                        style={
                          styles.noStaffText
                        }
                      >
                        No staff loaded. Check availability for the selected date and time.
                      </Text>
                    ) : (
                      availableStaff.map(
                        (
                          staff
                        ) => {
                          const selected =
                            selectedStaffId ===
                            staff.staffId;

                          return (
                            <TouchableOpacity
                              key={
                                staff.staffId
                              }
                              style={[
                                styles.staffCard,
                                selected &&
                                  styles.staffCardSelected,
                              ]}
                              activeOpacity={0.8}
                              onPress={() => {
                                Keyboard.dismiss();

                                setSelectedStaffId(
                                  staff.staffId
                                );
                              }}
                            >
                              <View
                                style={
                                  styles.staffRadio
                                }
                              >
                                {selected ? (
                                  <View
                                    style={
                                      styles.staffRadioInner
                                    }
                                  />
                                ) : null}
                              </View>

                              <View
                                style={
                                  styles.staffInfo
                                }
                              >
                                <Text
                                  style={
                                    styles.staffName
                                  }
                                >
                                  {staff.user
                                    ?.fullName ||
                                    staff.staffId}
                                </Text>

                                <Text
                                  style={
                                    styles.staffRole
                                  }
                                >
                                  {staff.staffRole ||
                                    "Staff"}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        }
                      )
                    )}

                    {selectedStaff ? (
                      <Text
                        style={
                          styles.selectedStaffText
                        }
                      >
                        Selected:{" "}
                        {selectedStaff.user
                          ?.fullName ||
                          selectedStaff.staffId}
                      </Text>
                    ) : null}
                  </>
                ) : null}

                {actionModal ===
                  "Reschedule" ||
                actionModal ===
                  "Cancel" ? (
                  <>
                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Reason
                    </Text>

                    <TextInput
                      value={
                        reason
                      }
                      onChangeText={
                        setReason
                      }
                      multiline
                      numberOfLines={4}
                      placeholder={
                        actionModal ===
                        "Reschedule"
                          ? "Why is this appointment being rescheduled?"
                          : "Why is this appointment being cancelled?"
                      }
                      placeholderTextColor={
                        Colors.textMuted
                      }
                      style={[
                        styles.input,
                        styles.textArea,
                      ]}
                      blurOnSubmit
                    />
                  </>
                ) : null}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Clerk Notes
                </Text>

                <TextInput
                  value={
                    clerkNotes
                  }
                  onChangeText={
                    setClerkNotes
                  }
                  multiline
                  numberOfLines={4}
                  placeholder="Optional notes for the client..."
                  placeholderTextColor={
                    Colors.textMuted
                  }
                  style={[
                    styles.input,
                    styles.textArea,
                  ]}
                  blurOnSubmit
                />

                <Text
                  style={
                    styles.keyboardHint
                  }
                >
                  Tap outside the text box or scroll to close the keyboard.
                </Text>

                <View
                  style={
                    styles.modalActions
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.cancelModalButton
                    }
                    disabled={
                      processing
                    }
                    activeOpacity={0.8}
                    onPress={
                      closeAction
                    }
                  >
                    <Text
                      style={
                        styles.cancelModalText
                      }
                    >
                      Back
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      processing &&
                        styles.disabledButton,
                    ]}
                    disabled={
                      processing
                    }
                    activeOpacity={0.8}
                    onPress={() =>
                      void submitReview()
                    }
                  >
                    {processing ? (
                      <ActivityIndicator
                        size="small"
                        color={
                          Colors.primary
                        }
                      />
                    ) : (
                      <Text
                        style={
                          styles.submitText
                        }
                      >
                        Confirm Action
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={
        styles.sectionCard
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {
          title
        }
      </Text>

      <View
        style={
          styles.sectionBody
        }
      >
        {
          children
        }
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.detailRow
      }
    >
      <Text
        style={
          styles.detailLabel
        }
      >
        {
          label
        }
      </Text>

      <Text
        style={
          styles.detailValue
        }
      >
        {
          value
        }
      </Text>
    </View>
  );
}

function ActionButton({
  title,
  icon,
  onPress,
  danger = false,
}: {
  title: string;
  icon:
    keyof typeof Ionicons.glyphMap;
  onPress:
    () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        danger &&
          styles.actionButtonDanger,
      ]}
      activeOpacity={0.8}
      onPress={
        onPress
      }
    >
      <Ionicons
        name={
          icon
        }
        size={20}
        color={
          danger
            ? "#FCA5A5"
            : Colors.gold
        }
      />

      <Text
        style={[
          styles.actionText,
          danger &&
            styles.actionTextDanger,
        ]}
      >
        {
          title
        }
      </Text>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={
          Colors.textMuted
        }
      />
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    keyboardView: {
      flex: 1,
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingTop: 16,
      paddingHorizontal: 18,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 13,
      color: Colors.textMuted,
    },

    errorPage: {
      flex: 1,
      paddingHorizontal: 18,
    },

    fixedHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingBottom: 12,
      backgroundColor: Colors.primary,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      zIndex: 10,
      elevation: 10,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      backgroundColor:
        "rgba(255,255,255,0.10)",
    },

    headerText: {
      flex: 1,
    },

    fixedHeaderTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors.white,
    },

    subtitle: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: "600",
      color: Colors.gold,
    },

    brandText: {
      fontSize: 13,
      fontWeight: "700",
      color: Colors.gold,
    },

    errorCard: {
      marginTop: 30,
      padding: 20,
      borderRadius: 16,
      backgroundColor:
        "rgba(220,38,38,0.15)",
    },

    errorText: {
      textAlign: "center",
      fontSize: 12,
      color: "#FCA5A5",
    },

    statusCard: {
      padding: 18,
      borderRadius: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    appointmentType: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors.white,
    },

    statusLabel: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: "700",
      color: Colors.gold,
    },

    priority: {
      marginTop: 4,
      fontSize: 11,
      color: Colors.textMuted,
    },

    sectionCard: {
      marginBottom: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor:
        Colors.cardBackground,
      overflow: "hidden",
    },

    sectionTitle: {
      padding: 16,
      paddingBottom: 12,
      fontSize: 15,
      fontWeight: "700",
      color: Colors.white,
      borderBottomWidth: 1,
      borderBottomColor:
        Colors.border,
    },

    sectionBody: {
      padding: 16,
    },

    detailRow: {
      marginBottom: 14,
    },

    detailLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      color: Colors.textMuted,
    },

    detailValue: {
      marginTop: 3,
      fontSize: 13,
      lineHeight: 19,
      color: Colors.white,
    },

    notesText: {
      fontSize: 13,
      lineHeight: 20,
      color: Colors.textSecondary,
    },

    actionsSection: {
      marginTop: 5,
      marginBottom: 10,
    },

    actionsTitle: {
      marginBottom: 10,
      fontSize: 17,
      fontWeight: "700",
      color: Colors.white,
    },

    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      marginBottom: 9,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    actionButtonDanger: {
      borderColor:
        "rgba(248,113,113,0.3)",
    },

    actionText: {
      flex: 1,
      marginLeft: 10,
      fontSize: 13,
      fontWeight: "600",
      color: Colors.white,
    },

    actionTextDanger: {
      color: "#FCA5A5",
    },

    closedCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      marginBottom: 12,
      borderRadius: 14,
      backgroundColor:
        Colors.cardBackground,
    },

    closedText: {
      flex: 1,
      marginLeft: 10,
      fontSize: 12,
      lineHeight: 18,
      color: Colors.textMuted,
    },

    modalKeyboardView: {
      flex: 1,
    },

    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor:
        "rgba(0,0,0,0.7)",
    },

    modalCard: {
      maxHeight: "88%",
      padding: 20,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      backgroundColor:
        Colors.secondary,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: Colors.border,
    },

    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },

    modalTitle: {
      flex: 1,
      paddingRight: 12,
      fontSize: 20,
      fontWeight: "700",
      color: Colors.white,
    },

    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        Colors.primary,
    },

    inputLabel: {
      marginTop: 12,
      marginBottom: 7,
      fontSize: 11,
      fontWeight: "600",
      color: Colors.textSecondary,
    },

    input: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 11,
      fontSize: 13,
      color: Colors.white,
      backgroundColor:
        Colors.cardBackground,
    },

    textArea: {
      minHeight: 90,
      textAlignVertical: "top",
    },

    inputHint: {
      marginTop: 5,
      fontSize: 9,
      color: Colors.textMuted,
    },

    keyboardHint: {
      marginTop: 8,
      fontSize: 9,
      lineHeight: 13,
      color: Colors.textMuted,
    },

    loadStaffButton: {
      alignItems: "center",
      padding: 11,
      marginTop: 10,
      borderRadius: 11,
      backgroundColor:
        Colors.primary,
    },

    loadStaffText: {
      fontSize: 11,
      fontWeight: "700",
      color: Colors.gold,
    },

    noStaffText: {
      fontSize: 11,
      lineHeight: 17,
      color: Colors.textMuted,
    },

    staffCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    staffCardSelected: {
      borderColor: Colors.gold,
    },

    staffRadio: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: Colors.gold,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    staffRadioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        Colors.gold,
    },

    staffInfo: {
      flex: 1,
    },

    staffName: {
      fontSize: 12,
      fontWeight: "700",
      color: Colors.white,
    },

    staffRole: {
      marginTop: 2,
      fontSize: 10,
      color: Colors.textMuted,
    },

    selectedStaffText: {
      marginTop: 5,
      fontSize: 10,
      color: Colors.gold,
    },

    modalActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 22,
    },

    cancelModalButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
    },

    cancelModalText: {
      fontSize: 12,
      fontWeight: "600",
      color: Colors.textSecondary,
    },

    submitButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor:
        Colors.gold,
    },

    disabledButton: {
      opacity: 0.6,
    },

    submitText: {
      fontSize: 12,
      fontWeight: "700",
      color: Colors.primary,
    },
  });


// ============================================================
// ALSO CHANGE THIS IN:
// app/(clerk)/appointments/index.tsx
//
// The Appointment list Back button must go DIRECTLY to Dashboard.
// Do NOT use router.back() there.
// ============================================================

/*

<TouchableOpacity
  style={styles.backButton}
  onPress={() =>
    router.replace(
      "/(clerk)" as never
    )
  }
>
  <Ionicons
    name="arrow-back"
    size={22}
    color={Colors.white}
  />
</TouchableOpacity>

*/