// app/(clerk)/funerals-requests/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import {
  useCallback,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  approveFuneralRequest,
  assignFuneralStaff,
  FuneralRequestDetails,
  FuneralStaff,
  getAvailableFuneralStaff,
  getFuneralRequestById,
  rejectFuneralRequest,
} from "../../../services/funeralRequest";

import Colors from "../../../src/theme/colors";

const STAFF_REQUIRED = 4;

function normalize(
  value?: string | null
): string {
  return (value || "")
    .trim()
    .toLowerCase();
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function formatTime(
  value?: string | null
): string {
  if (!value) {
    return "Not specified";
  }

  return value.length >= 5
    ? value.slice(0, 5)
    : value;
}

function getStaffAssigned(
  funeral: FuneralRequestDetails
): number {
  return (
    funeral.staffAssigned ??
    funeral.staffDeployed?.length ??
    0
  );
}

export default function FuneralRequestDetailsScreen() {
  const { id } =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const funeralRequestId =
    Array.isArray(id)
      ? id[0]
      : id;

  const [
    funeral,
    setFuneral,
  ] = useState<
    FuneralRequestDetails | null
  >(null);

  const [
    availableStaff,
    setAvailableStaff,
  ] = useState<FuneralStaff[]>([]);

  const [
    selectedStaffIds,
    setSelectedStaffIds,
  ] = useState<string[]>([]);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    assigning,
    setAssigning,
  ] = useState(false);

  const [
    reviewing,
    setReviewing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const loadScreen =
    useCallback(
      async (): Promise<void> => {
        if (!funeralRequestId) {
          setError(
            "Funeral request ID is missing."
          );

          setLoading(false);
          return;
        }

        try {
          setError("");

          const details =
            await getFuneralRequestById(
              funeralRequestId
            );

          setFuneral(details);

          const existingStaffIds =
            (
              details.staffDeployed ??
              []
            )
              .map(
                (staff) =>
                  staff.staffId
              )
              .filter(Boolean);

          setSelectedStaffIds(
            existingStaffIds
          );

          if (
            normalize(
              details.status
            ) === "pending"
          ) {
            const available =
              await getAvailableFuneralStaff(
                funeralRequestId
              );

            setAvailableStaff(
              Array.isArray(
                available.staff
              )
                ? available.staff
                : []
            );
          } else {
            setAvailableStaff([]);
          }
        } catch (err) {
          console.log(
            "[FUNERAL DETAILS] ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load funeral request."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        funeralRequestId,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      void loadScreen();
    }, [loadScreen])
  );

  const goToDashboard =
    (): void => {
      router.replace(
        "/(clerk)"
      );
    };

  const goToFunerals =
    (): void => {
      router.replace(
        "/(clerk)/funerals-requests"
      );
    };

  const toggleStaff = (
    staffId: string
  ): void => {
    if (
      normalize(
        funeral?.status
      ) !== "pending"
    ) {
      return;
    }

    setSelectedStaffIds(
      (current) => {
        if (
          current.includes(
            staffId
          )
        ) {
          return current.filter(
            (idValue) =>
              idValue !== staffId
          );
        }

        if (
          current.length >=
          STAFF_REQUIRED
        ) {
          Alert.alert(
            "Maximum Reached",
            "Only 4 staff members can be selected."
          );

          return current;
        }

        return [
          ...current,
          staffId,
        ];
      }
    );
  };

  const handleAssignStaff =
    async (): Promise<void> => {
      if (!funeralRequestId) {
        return;
      }

      if (
        selectedStaffIds.length !==
        STAFF_REQUIRED
      ) {
        Alert.alert(
          "Staff Required",
          "Select exactly 4 staff members."
        );

        return;
      }

      try {
        setAssigning(true);

        await assignFuneralStaff(
          funeralRequestId,
          selectedStaffIds
        );

        await loadScreen();

        Alert.alert(
          "Staff Assigned",
          "4 staff members were assigned successfully."
        );
      } catch (err) {
        console.log(
          "[ASSIGN STAFF] ERROR:",
          err
        );

        Alert.alert(
          "Unable to Assign Staff",
          err instanceof Error
            ? err.message
            : "Staff assignment failed."
        );
      } finally {
        setAssigning(false);
      }
    };

  const handleApprove =
    (): void => {
      if (
        !funeralRequestId ||
        !funeral
      ) {
        return;
      }

      const assigned =
        getStaffAssigned(
          funeral
        );

      if (
        assigned !==
        STAFF_REQUIRED
      ) {
        Alert.alert(
          "Staff Required",
          "Exactly 4 staff members must be assigned before approval."
        );

        return;
      }

      Alert.alert(
        "Approve Funeral",
        "Are you sure you want to approve this funeral request?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Approve",
            onPress:
              async () => {
                try {
                  setReviewing(true);

                  await approveFuneralRequest(
                    funeralRequestId
                  );

                  Alert.alert(
                    "Approved",
                    "The funeral request has been approved.",
                    [
                      {
                        text: "OK",
                        onPress:
                          goToFunerals,
                      },
                    ]
                  );
                } catch (err) {
                  console.log(
                    "[APPROVE] ERROR:",
                    err
                  );

                  Alert.alert(
                    "Unable to Approve",
                    err instanceof Error
                      ? err.message
                      : "Funeral approval failed."
                  );
                } finally {
                  setReviewing(false);
                }
              },
          },
        ]
      );
    };

  const handleReject =
    (): void => {
      if (!funeralRequestId) {
        return;
      }

      const reason =
        rejectionReason.trim();

      if (!reason) {
        Alert.alert(
          "Reason Required",
          "Enter a rejection reason."
        );

        return;
      }

      Alert.alert(
        "Reject Funeral",
        "Are you sure you want to reject this funeral request?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Reject",
            style: "destructive",
            onPress:
              async () => {
                try {
                  setReviewing(true);

                  await rejectFuneralRequest(
                    funeralRequestId,
                    reason
                  );

                  Alert.alert(
                    "Rejected",
                    "The funeral request has been rejected.",
                    [
                      {
                        text: "OK",
                        onPress:
                          goToFunerals,
                      },
                    ]
                  );
                } catch (err) {
                  console.log(
                    "[REJECT] ERROR:",
                    err
                  );

                  Alert.alert(
                    "Unable to Reject",
                    err instanceof Error
                      ? err.message
                      : "Funeral rejection failed."
                  );
                } finally {
                  setReviewing(false);
                }
              },
          },
        ]
      );
    };

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
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
            Loading funeral details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error ||
    !funeral
  ) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.center
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color="#DC2626"
          />

          <Text
            style={
              styles.errorTitle
            }
          >
            Unable to Load Request
          </Text>

          <Text
            style={
              styles.errorText
            }
          >
            {error ||
              "Funeral request not found."}
          </Text>

          <TouchableOpacity
            style={
              styles.retryButton
            }
            onPress={() => {
              setLoading(true);
              void loadScreen();
            }}
          >
            <Text
              style={
                styles.retryText
              }
            >
              Retry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.dashboardErrorButton
            }
            onPress={
              goToDashboard
            }
          >
            <Text
              style={
                styles.dashboardErrorText
              }
            >
              Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isPending =
    normalize(
      funeral.status
    ) === "pending";

  const staffAssigned =
    getStaffAssigned(
      funeral
    );

  const fullyStaffed =
    staffAssigned ===
    STAFF_REQUIRED;

  return (
    <SafeAreaView
      style={
        styles.container
      }
      edges={[
        "top",
        "left",
        "right",
      ]}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.navigationRow
          }
        >
          <TouchableOpacity
            style={
              styles.navigationButton
            }
            onPress={
              goToFunerals
            }
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color={
                Colors.gold
              }
            />

            <Text
              style={
                styles.navigationButtonText
              }
            >
              Funerals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.navigationButton
            }
            onPress={
              goToDashboard
            }
          >
            <Ionicons
              name="grid-outline"
              size={18}
              color={
                Colors.gold
              }
            />

            <Text
              style={
                styles.navigationButtonText
              }
            >
              Dashboard
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Funeral Request
            </Text>

            <Text
              style={
                styles.requestId
              }
              numberOfLines={
                1
              }
            >
              {
                funeral.funeralRequestId
              }
            </Text>
          </View>

          <View
            style={
              styles.statusBadge
            }
          >
            <Text
              style={
                styles.statusText
              }
            >
              {funeral.status ||
                "Pending"}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitle
            }
          >
            Funeral Details
          </Text>

          <DetailRow
            icon="flower-outline"
            label="Funeral Type"
            value={
              funeral.funeralType ||
              "Standard"
            }
          />

          <DetailRow
            icon="calendar-outline"
            label="Date"
            value={formatDate(
              funeral.funeralDate
            )}
          />

          <DetailRow
            icon="time-outline"
            label="Time"
            value={formatTime(
              funeral.funeralTime
            )}
          />

          <DetailRow
            icon="location-outline"
            label="Venue"
            value={
              funeral.venue ||
              "Not specified"
            }
          />

          <DetailRow
            icon="business-outline"
            label="Branch"
            value={
              funeral.branchName ||
              funeral.branchId ||
              "Not specified"
            }
          />

          {funeral.notes ? (
            <DetailRow
              icon="document-text-outline"
              label="Notes"
              value={
                funeral.notes
              }
            />
          ) : null}
        </View>

        <View
          style={
            styles.card
          }
        >
          <View
            style={
              styles.staffHeader
            }
          >
            <View
              style={
                styles.staffHeaderText
              }
            >
              <Text
                style={
                  styles.cardTitle
                }
              >
                Staff Assignment
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                Select exactly 4 available staff members.
              </Text>
            </View>

            <View
              style={[
                styles.staffCountBadge,
                fullyStaffed &&
                  styles.staffCountBadgeComplete,
              ]}
            >
              <Text
                style={[
                  styles.staffCountText,
                  fullyStaffed &&
                    styles.staffCountTextComplete,
                ]}
              >
                {staffAssigned}/4
              </Text>
            </View>
          </View>

          {funeral.staffDeployed &&
          funeral.staffDeployed.length >
            0 ? (
            <>
              <Text
                style={
                  styles.sectionLabel
                }
              >
                Assigned Staff
              </Text>

              {funeral.staffDeployed.map(
                (staff) => (
                  <View
                    key={
                      staff.funeralStaffDeploymentId
                        ? `${staff.funeralStaffDeploymentId}-${staff.staffId}`
                        : staff.staffId
                    }
                    style={
                      styles.assignedRow
                    }
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={24}
                      color={
                        Colors.gold
                      }
                    />

                    <View
                      style={
                        styles.assignedInfo
                      }
                    >
                      <Text
                        style={
                          styles.staffName
                        }
                      >
                        {staff.fullName ||
                          staff.displayStaffId ||
                          staff.staffId}
                      </Text>

                      <Text
                        style={
                          styles.staffRole
                        }
                      >
                        {staff.role ||
                          "Operational Staff"}
                      </Text>
                    </View>
                  </View>
                )
              )}
            </>
          ) : null}

          {isPending ? (
            <>
              <Text
                style={
                  styles.sectionLabel
                }
              >
                Available Branch Staff
              </Text>

              {availableStaff.length ===
              0 ? (
                <View
                  style={
                    styles.notice
                  }
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={
                      Colors.textMuted
                    }
                  />

                  <Text
                    style={
                      styles.noticeText
                    }
                  >
                    No available staff were found for this branch and funeral time.
                  </Text>
                </View>
              ) : (
                availableStaff.map(
                  (staff) => {
                    const selected =
                      selectedStaffIds.includes(
                        staff.staffId
                      );

                    return (
                      <TouchableOpacity
                        key={
                          staff.staffId
                        }
                        style={[
                          styles.staffOption,
                          selected &&
                            styles.staffOptionSelected,
                        ]}
                        onPress={() =>
                          toggleStaff(
                            staff.staffId
                          )
                        }
                      >
                        <View
                          style={[
                            styles.checkbox,
                            selected &&
                              styles.checkboxSelected,
                          ]}
                        >
                          {selected ? (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={
                                Colors.white
                              }
                            />
                          ) : null}
                        </View>

                        <View
                          style={
                            styles.staffOptionInfo
                          }
                        >
                          <Text
                            style={
                              styles.staffName
                            }
                          >
                            {staff.fullName ||
                              staff.displayStaffId ||
                              staff.staffId}
                          </Text>

                          <Text
                            style={
                              styles.staffRole
                            }
                          >
                            {staff.role ||
                              "Operational Staff"}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.staffId
                          }
                        >
                          {staff.displayStaffId ||
                            staff.staffId}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )
              )}

              <TouchableOpacity
                style={[
                  styles.assignButton,
                  selectedStaffIds.length !==
                    STAFF_REQUIRED &&
                    styles.disabledButton,
                ]}
                disabled={
                  assigning ||
                  selectedStaffIds.length !==
                    STAFF_REQUIRED
                }
                onPress={() =>
                  void handleAssignStaff()
                }
              >
                {assigning ? (
                  <ActivityIndicator
                    color={
                      Colors.white
                    }
                  />
                ) : (
                  <>
                    <Ionicons
                      name="people-outline"
                      size={20}
                      color={
                        Colors.white
                      }
                    />

                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      Assign{" "}
                      {
                        selectedStaffIds.length
                      }
                      /4 Staff
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {isPending ? (
          <View
            style={
              styles.reviewCard
            }
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              Review Request
            </Text>

            <Text
              style={
                styles.cardSubtitle
              }
            >
              Approval requires exactly 4 assigned staff members.
            </Text>

            <TouchableOpacity
              style={[
                styles.approveButton,
                !fullyStaffed &&
                  styles.disabledButton,
              ]}
              disabled={
                reviewing ||
                !fullyStaffed
              }
              onPress={
                handleApprove
              }
            >
              {reviewing ? (
                <ActivityIndicator
                  color={
                    Colors.white
                  }
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color={
                      Colors.white
                    }
                  />

                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Approve Funeral
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {!fullyStaffed ? (
              <Text
                style={
                  styles.approvalHint
                }
              >
                Assign 4/4 staff to enable approval.
              </Text>
            ) : (
              <Text
                style={
                  styles.readyHint
                }
              >
                4/4 staff assigned. Ready for approval.
              </Text>
            )}

            <View
              style={
                styles.separator
              }
            />

            <Text
              style={
                styles.rejectTitle
              }
            >
              Reject Funeral
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="Enter rejection reason..."
              placeholderTextColor={
                Colors.textMuted
              }
              multiline
              value={
                rejectionReason
              }
              onChangeText={
                setRejectionReason
              }
            />

            <TouchableOpacity
              style={[
                styles.rejectButton,
                reviewing &&
                  styles.disabledButton,
              ]}
              disabled={
                reviewing
              }
              onPress={
                handleReject
              }
            >
              <Ionicons
                name="close-circle-outline"
                size={21}
                color={
                  Colors.white
                }
              />

              <Text
                style={
                  styles.buttonText
                }
              >
                Reject Funeral
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              Review Completed
            </Text>

            <DetailRow
              icon="checkmark-circle-outline"
              label="Status"
              value={
                funeral.status ||
                "Unknown"
              }
            />

            {funeral.rejectionReason ? (
              <DetailRow
                icon="alert-circle-outline"
                label="Rejection Reason"
                value={
                  funeral.rejectionReason
                }
              />
            ) : null}

            {funeral.approvedDate ? (
              <DetailRow
                icon="calendar-outline"
                label="Approved Date"
                value={formatDate(
                  funeral.approvedDate
                )}
              />
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.detailRow
      }
    >
      <View
        style={
          styles.detailIcon
        }
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            Colors.gold
          }
        />
      </View>

      <View
        style={
          styles.detailContent
        }
      >
        <Text
          style={
            styles.detailLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.detailValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        Colors.background,
    },

    content: {
      padding: 16,
      paddingBottom: 50,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
    },

    navigationRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 16,
    },

    navigationButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    navigationButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: Colors.gold,
    },

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      marginBottom: 16,
    },

    headerText: {
      flex: 1,
      paddingRight: 12,
    },

    title: {
      fontSize: 23,
      fontWeight: "700",
      color:
        Colors.textPrimary,
    },

    requestId: {
      marginTop: 4,
      fontSize: 10,
      color:
        Colors.textMuted,
    },

    statusBadge: {
      borderRadius: 14,
      paddingHorizontal: 11,
      paddingVertical: 6,
      backgroundColor:
        Colors.primary,
    },

    statusText: {
      fontSize: 11,
      fontWeight: "700",
      color: Colors.gold,
    },

    card: {
      padding: 16,
      marginBottom: 15,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    reviewCard: {
      padding: 16,
      marginBottom: 15,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        Colors.gold,
      backgroundColor:
        Colors.cardBackground,
    },

    cardTitle: {
      fontSize: 17,
      fontWeight: "700",
      color:
        Colors.textPrimary,
    },

    cardSubtitle: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 17,
      color:
        Colors.textMuted,
    },

    detailRow: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      marginTop: 15,
    },

    detailIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        Colors.primary,
    },

    detailContent: {
      flex: 1,
      marginLeft: 10,
    },

    detailLabel: {
      fontSize: 10,
      fontWeight: "700",
      textTransform:
        "uppercase",
      color:
        Colors.textMuted,
    },

    detailValue: {
      marginTop: 3,
      fontSize: 14,
      fontWeight: "600",
      color:
        Colors.textPrimary,
    },

    staffHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    staffHeaderText: {
      flex: 1,
      paddingRight: 12,
    },

    staffCountBadge: {
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 15,
      backgroundColor:
        "#FEF3C7",
    },

    staffCountBadgeComplete: {
      backgroundColor:
        "#DCFCE7",
    },

    staffCountText: {
      fontWeight: "700",
      color: "#92400E",
    },

    staffCountTextComplete: {
      color: "#166534",
    },

    sectionLabel: {
      marginTop: 17,
      marginBottom: 8,
      fontSize: 10,
      fontWeight: "700",
      textTransform:
        "uppercase",
      color:
        Colors.textMuted,
    },

    assignedRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 7,
    },

    assignedInfo: {
      flex: 1,
      marginLeft: 9,
    },

    staffName: {
      fontSize: 13,
      fontWeight: "600",
      color:
        Colors.textPrimary,
    },

    staffRole: {
      marginTop: 2,
      fontSize: 11,
      color:
        Colors.textMuted,
    },

    staffOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      marginBottom: 8,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        Colors.border,
    },

    staffOptionSelected: {
      borderColor:
        Colors.gold,
      backgroundColor:
        Colors.background,
    },

    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor:
        Colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    checkboxSelected: {
      borderColor:
        Colors.gold,
      backgroundColor:
        Colors.gold,
    },

    staffOptionInfo: {
      flex: 1,
      marginLeft: 10,
    },

    staffId: {
      fontSize: 10,
      fontWeight: "700",
      color: Colors.gold,
    },

    notice: {
      flexDirection: "row",
      padding: 12,
      borderRadius: 10,
      backgroundColor:
        Colors.background,
    },

    noticeText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 12,
      lineHeight: 17,
      color:
        Colors.textMuted,
    },

    assignButton: {
      marginTop: 15,
      minHeight: 48,
      borderRadius: 11,
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        Colors.primary,
    },

    approveButton: {
      marginTop: 17,
      minHeight: 50,
      borderRadius: 11,
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#16A34A",
    },

    rejectButton: {
      marginTop: 12,
      minHeight: 50,
      borderRadius: 11,
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#DC2626",
    },

    buttonText: {
      fontSize: 14,
      fontWeight: "700",
      color:
        Colors.white,
    },

    disabledButton: {
      opacity: 0.4,
    },

    approvalHint: {
      marginTop: 8,
      textAlign: "center",
      fontSize: 11,
      color: "#B45309",
    },

    readyHint: {
      marginTop: 8,
      textAlign: "center",
      fontSize: 11,
      fontWeight: "700",
      color: "#16A34A",
    },

    separator: {
      height: 1,
      marginVertical: 20,
      backgroundColor:
        Colors.border,
    },

    rejectTitle: {
      fontSize: 14,
      fontWeight: "700",
      color:
        Colors.textPrimary,
    },

    input: {
      minHeight: 90,
      marginTop: 9,
      padding: 12,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        Colors.border,
      color:
        Colors.textPrimary,
      backgroundColor:
        Colors.background,
      textAlignVertical:
        "top",
    },

    loadingText: {
      marginTop: 12,
      color:
        Colors.textMuted,
    },

    errorTitle: {
      marginTop: 14,
      fontSize: 18,
      fontWeight: "700",
      color:
        Colors.textPrimary,
    },

    errorText: {
      marginTop: 8,
      textAlign: "center",
      color:
        Colors.textMuted,
    },

    retryButton: {
      marginTop: 18,
      paddingHorizontal: 20,
      paddingVertical: 11,
      borderRadius: 10,
      backgroundColor:
        Colors.primary,
    },

    retryText: {
      fontWeight: "700",
      color:
        Colors.gold,
    },

    dashboardErrorButton: {
      marginTop: 10,
      paddingHorizontal: 20,
      paddingVertical: 11,
    },

    dashboardErrorText: {
      fontWeight: "700",
      color:
        Colors.gold,
    },
  });