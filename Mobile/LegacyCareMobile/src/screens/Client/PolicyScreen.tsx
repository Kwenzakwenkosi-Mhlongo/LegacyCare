import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../../components/Button/Button";
import { useAuth } from "../../context/AuthContext";
import API_URL from "../../services/api";
import { getToken } from "../../services/auth";
import Colors from "../../theme/colors";
import Typography from "../../theme/typography";

interface Policy {
  policyId: string;
  startDate: string;
  endDate: string | null;
  packageId: string;
  userId: string;
  status: "Active" | "Pending" | "Cancelled" | "Lapsed" | "Expired";
  packageName: string;
  monthlyPremium: number;
  package: Package | null;
  beneficiaries: Beneficiary[];
}

interface Beneficiary {
  beneficiaryId: string;
  fullName: string;
  idNumber: string;
  relationship: number;
  status: number;
  policyId: string;
  allocationPercentage?: number;
  contactNumber?: string;
}

interface Package {
  packageId: string;
  name: string;
  monthlyPremium: number;
  description: string;
  maxBeneficiaries: number;
}

const relationshipMap: Record<number, string> = {
  0: "Spouse",
  1: "Child",
  2: "Parent",
  3: "Sibling",
  4: "Other",
};

const relationshipReverseMap: Record<string, number> = {
  Spouse: 0,
  Child: 1,
  Parent: 2,
  Sibling: 3,
  Other: 4,
};

const beneficiaryStatusMap: Record<number, string> = {
  0: "Active",
  1: "Alive",
  2: "Deceased",
  3: "Removed",
};

export default function PolicyScreen() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showPolicyDetail, setShowPolicyDetail] = useState(false);

  const [showViewPackagesModal, setShowViewPackagesModal] = useState(false);
  const [showPackageDetailModal, setShowPackageDetailModal] = useState(false);
  const [showPackageChangeModal, setShowPackageChangeModal] = useState(false);
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false);
  const [showRemoveBeneficiaryModal, setShowRemoveBeneficiaryModal] = useState(false);

  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [newBeneficiary, setNewBeneficiary] = useState({
    fullName: "",
    relationship: "",
    idNumber: "",
    contactNumber: "",
    allocationPercentage: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = await getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const loadPolicies = async () => {
    if (!user?.userId) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    setLoading(true);
    try {
      const headers = await getAuthHeaders();

      const policyResponse = await fetch(`${API_URL}/Policy/user/${user.userId}`, { headers });

      if (policyResponse.ok) {
        const policyData = await policyResponse.json();

        const mappedPolicies = policyData.map((p: any) => {
          const mappedBeneficiaries = (p.beneficiaries || []).map((b: any) => {
            let statusNumber = 0;
            if (b.status === "Active" || b.status === 0 || b.status === "0") {
              statusNumber = 0;
            } else if (b.status === "Alive" || b.status === 1 || b.status === "1") {
              statusNumber = 1;
            } else if (b.status === "Deceased" || b.status === 2 || b.status === "2") {
              statusNumber = 2;
            } else if (b.status === "Removed" || b.status === 3 || b.status === "3") {
              statusNumber = 3;
            }
            
            return {
              ...b,
              status: statusNumber,
            };
          });

          return {
            ...p,
            packageName: p.packageName || "No Package",
            monthlyPremium: p.monthlyPremium || 0,
            package: p.package || {
              packageId: p.packageId,
              name: p.packageName || "No Package",
              monthlyPremium: p.monthlyPremium || 0,
              description: p.packageDescription || "",
              maxBeneficiaries: p.maxBeneficiaries || 5,
            },
            beneficiaries: mappedBeneficiaries,
          };
        });

        setPolicies(mappedPolicies);
      } else {
        const errorText = await policyResponse.text();
        throw new Error("Failed to load policies");
      }

      const packageResponse = await fetch(`${API_URL}/Package`, { headers });

      if (packageResponse.ok) {
        const packageData = await packageResponse.json();
        setPackages(packageData);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to load policies. Please try again.", [
        { text: "Retry", onPress: loadPolicies },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleSelectPolicy = (policy: Policy) => {
    setSelectedPolicy(policy);
    setShowPolicyDetail(true);
  };

  const handleBackToPolicyList = () => {
    setShowPolicyDetail(false);
    setSelectedPolicy(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPolicies();
    setRefreshing(false);
  };

  const handleViewPackages = () => {
    setShowViewPackagesModal(true);
  };

  const handleViewPackageDetail = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowViewPackagesModal(false);
    setShowPackageDetailModal(true);
  };

  const handleRequestPackageChange = () => {
    if (!selectedPolicy) {
      Alert.alert("Error", "Please select a policy first");
      return;
    }
    setShowPackageChangeModal(true);
  };

  const selectPackageToChange = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowPackageChangeModal(false);
    setShowPackageDetailModal(true);
  };

  const confirmPackageChange = async () => {
    if (!selectedPackage || !selectedPolicy) return;

    if (!user?.userId) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();

      const requestData = {
        userId: user.userId,
        clientId: user.userId,
        policyId: selectedPolicy.policyId,
        newPackageId: selectedPackage.packageId,
        requestDate: new Date().toISOString(),
        status: 0,
      };

      const response = await fetch(`${API_URL}/PackageChangeRequest`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        setShowPackageDetailModal(false);
        setSelectedPackage(null);

        Alert.alert(
          "Request Submitted",
          `Your request to change to "${selectedPackage.name}" has been submitted.\n\nThis request has been sent for review. You will receive confirmation once approved.`
        );
      } else {
        const error = await response.text();
        Alert.alert("Error", error || "Failed to submit request");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit package change request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddBeneficiary = () => {
    if (!selectedPolicy) {
      Alert.alert("Error", "Please select a policy first");
      return;
    }
    setShowAddBeneficiaryModal(true);
  };

  const validateBeneficiary = () => {
    const errors: Record<string, string> = {};

    if (!newBeneficiary.fullName || newBeneficiary.fullName.length < 2) {
      errors.fullName = "Please enter beneficiary's full name";
    }
    if (!newBeneficiary.relationship) {
      errors.relationship = "Please specify the relationship";
    }
    if (!newBeneficiary.idNumber || newBeneficiary.idNumber.length < 10) {
      errors.idNumber = "Please enter a valid ID number";
    }
    if (!newBeneficiary.contactNumber || newBeneficiary.contactNumber.length < 10) {
      errors.contactNumber = "Please enter a valid contact number";
    }
    if (!newBeneficiary.allocationPercentage || parseInt(newBeneficiary.allocationPercentage) <= 0) {
      errors.allocationPercentage = "Please enter a valid percentage (1-100)";
    }
    if (parseInt(newBeneficiary.allocationPercentage) > 100) {
      errors.allocationPercentage = "Percentage cannot exceed 100%";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddBeneficiarySubmit = async () => {
    if (!selectedPolicy) return;

    if (!user?.userId) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    if (!validateBeneficiary()) {
      Alert.alert("Invalid Information", "Please check the form for errors and try again.");
      return;
    }

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();

      const requestData = {
        userId: user.userId,
        policyId: selectedPolicy.policyId,
        fullName: newBeneficiary.fullName,
        idNumber: newBeneficiary.idNumber,
        relationship: relationshipReverseMap[newBeneficiary.relationship] ?? 4,
        requestType: 0,
        status: 0,
        requestDate: new Date().toISOString(),
        description: `Request to add ${newBeneficiary.fullName} as beneficiary`,
      };

      const response = await fetch(`${API_URL}/BeneficiaryRequest`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        await loadPolicies();

        setShowAddBeneficiaryModal(false);
        setNewBeneficiary({
          fullName: "",
          relationship: "",
          idNumber: "",
          contactNumber: "",
          allocationPercentage: "",
        });

        Alert.alert(
          "Beneficiary Added",
          `Your request to add ${newBeneficiary.fullName} to policy has been submitted for approval.\n\nYou will be notified once approved.`
        );
      } else {
        const error = await response.text();
        Alert.alert("Error", error || "Failed to add beneficiary");
      }
    } catch {
      Alert.alert("Error", "Failed to submit request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveBeneficiary = (beneficiary: Beneficiary) => {
    if (!selectedPolicy) {
      Alert.alert("Error", "Please select a policy first");
      return;
    }
    setSelectedBeneficiary(beneficiary);
    setShowRemoveBeneficiaryModal(true);
  };

  const confirmRemoveBeneficiary = async () => {
    if (!selectedBeneficiary || !selectedPolicy) return;

    if (!user?.userId) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();

      const requestData = {
        userId: user.userId,
        policyId: selectedPolicy.policyId,
        beneficiaryId: selectedBeneficiary.beneficiaryId,
        fullName: selectedBeneficiary.fullName,
        idNumber: selectedBeneficiary.idNumber,
        relationship: selectedBeneficiary.relationship,
        requestType: 1,
        status: 0,
        requestDate: new Date().toISOString(),
        description: `Request to remove ${selectedBeneficiary.fullName} as beneficiary`,
      };

      const response = await fetch(`${API_URL}/BeneficiaryRequest`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        setPolicies(
          policies.map((p) =>
            p.policyId === selectedPolicy.policyId
              ? {
                  ...p,
                  beneficiaries: p.beneficiaries.map((b) =>
                    b.beneficiaryId === selectedBeneficiary.beneficiaryId
                      ? { ...b, status: 3 }
                      : b
                  ),
                }
              : p
          )
        );

        setShowRemoveBeneficiaryModal(false);
        setSelectedBeneficiary(null);

        Alert.alert(
          "Beneficiary Removal Requested",
          `Your request to remove ${selectedBeneficiary.fullName} from policy has been submitted for approval.\n\nYou will be notified once processed.`
        );
      } else {
        const error = await response.text();
        Alert.alert("Error", error || "Failed to submit removal request");
      }
    } catch {
      Alert.alert("Error", "Failed to submit removal request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return Colors.success;
      case "Pending": return Colors.warning;
      case "Cancelled": return Colors.danger;
      case "Lapsed": return Colors.textMuted;
      case "Expired": return Colors.danger;
      default: return Colors.textMuted;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Active": return styles.activeBadge;
      case "Pending": return styles.pendingBadge;
      case "Cancelled": return styles.cancelledBadge;
      case "Lapsed": return styles.inactiveBadge;
      case "Expired": return styles.expiredBadge;
      default: return styles.inactiveBadge;
    }
  };

  const getRelationshipLabel = (relationship: number) => {
    return relationshipMap[relationship] || "Other";
  };

  const getBeneficiaryStatusLabel = (status: number) => {
    return beneficiaryStatusMap[status] || "Active";
  };

  const getBeneficiaryStatusColor = (status: number) => {
    switch (status) {
      case 0: return Colors.success;
      case 1: return Colors.success;
      case 2: return Colors.danger;
      case 3: return Colors.textMuted;
      default: return Colors.textMuted;
    }
  };

  const getBeneficiaryStatusStyle = (status: number) => {
    switch (status) {
      case 0: return styles.activeBadge;
      case 1: return styles.activeBadge;
      case 2: return styles.expiredBadge;
      case 3: return styles.inactiveBadge;
      default: return styles.inactiveBadge;
    }
  };

  const renderPolicyItem = ({ item }: { item: Policy }) => (
    <TouchableOpacity
      style={styles.policyListItem}
      onPress={() => handleSelectPolicy(item)}
    >
      <View style={styles.policyListHeader}>
        <View>
          <Text style={styles.policyListNumber}>
            {item.policyId.substring(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.policyListName}>
            {item.packageName || "No Package"}
          </Text>
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.policyListDetails}>
        <Text style={styles.policyListClient}>
          {user?.fullName || "Client"}
        </Text>
        <Text style={styles.policyListAmount}>
          R {item.monthlyPremium?.toFixed(2) || "0.00"}
        </Text>
      </View>
      <View style={styles.policyListArrow}>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  const renderBeneficiaryCard = (beneficiary: Beneficiary) => (
    <View key={beneficiary.beneficiaryId} style={styles.beneficiaryCard}>
      <View style={styles.beneficiaryHeader}>
        <View style={styles.beneficiaryInfo}>
          <Text style={styles.beneficiaryName}>{beneficiary.fullName}</Text>
          <Text style={styles.beneficiaryRelationship}>
            {getRelationshipLabel(beneficiary.relationship)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            getBeneficiaryStatusStyle(beneficiary.status),
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getBeneficiaryStatusColor(beneficiary.status) },
            ]}
          >
            {getBeneficiaryStatusLabel(beneficiary.status)}
          </Text>
        </View>
      </View>

      <View style={styles.beneficiaryDetails}>
        <Text style={styles.beneficiaryId}>ID: {beneficiary.idNumber}</Text>
        {beneficiary.contactNumber && (
          <Text style={styles.beneficiaryContact}>📞 {beneficiary.contactNumber}</Text>
        )}
        {beneficiary.allocationPercentage && (
          <Text style={styles.beneficiaryPercentage}>
            Allocation: {beneficiary.allocationPercentage}%
          </Text>
        )}
      </View>

      {beneficiary.status !== 2 && beneficiary.status !== 3 && (
        <TouchableOpacity
          style={styles.removeBeneficiaryButton}
          onPress={() => handleRemoveBeneficiary(beneficiary)}
        >
          <Ionicons name="person-remove-outline" size={16} color={Colors.danger} />
          <Text style={styles.removeBeneficiaryText}>Remove Beneficiary</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !policies.length) {
    return (
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading policies...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Policies</Text>
      </View>

      {!showPolicyDetail ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
          }
        >
          {policies.length > 0 ? (
            <FlatList
              data={policies}
              renderItem={renderPolicyItem}
              keyExtractor={(item) => item.policyId}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={60} color={Colors.textMuted} />
              <Text style={styles.emptyStateText}>No policies found</Text>
              <Text style={styles.emptyStateSubtext}>
                Contact your LegacyCare administrator
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
          }
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBackToPolicyList}>
            <Ionicons name="arrow-back" size={24} color={Colors.gold} />
            <Text style={styles.backButtonText}>Back to Policies</Text>
          </TouchableOpacity>

          {selectedPolicy && (
            <>
              <View style={styles.policyCard}>
                <View style={styles.policyHeader}>
                  <View>
                    <Text style={styles.policyNumber}>
                      {selectedPolicy.policyId.substring(0, 8).toUpperCase()}
                    </Text>
                    <Text style={styles.packageName}>
                      {selectedPolicy.packageName || "No Package"}
                    </Text>
                    <Text style={styles.clientName}>
                      {user?.fullName || "Client"}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(selectedPolicy.status)]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedPolicy.status) }]}>
                      {selectedPolicy.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.policyDetails}>
                  <View style={styles.policyDetailRow}>
                    <Text style={styles.detailLabel}>Package Type</Text>
                    <Text style={styles.detailValue}>
                      {selectedPolicy.packageName || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.policyDetailRow}>
                    <Text style={styles.detailLabel}>Monthly Premium</Text>
                    <Text style={styles.detailValue}>
                      R {selectedPolicy.monthlyPremium?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                  <View style={styles.policyDetailRow}>
                    <Text style={styles.detailLabel}>Start Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedPolicy.startDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.policyDetailRow}>
                    <Text style={styles.detailLabel}>End Date</Text>
                    <Text style={styles.detailValue}>
                      {selectedPolicy.endDate
                        ? new Date(selectedPolicy.endDate).toLocaleDateString()
                        : "N/A"}
                    </Text>
                  </View>
                  <View style={styles.policyDetailRow}>
                    <Text style={styles.detailLabel}>Max Beneficiaries</Text>
                    <Text style={styles.detailValue}>
                      {selectedPolicy.package?.maxBeneficiaries || 5}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.viewPackagesButton} onPress={handleViewPackages}>
                  <Ionicons name="grid-outline" size={20} color={Colors.gold} />
                  <Text style={styles.viewPackagesText}>View Available Packages</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.changePackageButton}
                  onPress={handleRequestPackageChange}
                >
                  <Ionicons name="swap-horizontal-outline" size={20} color={Colors.gold} />
                  <Text style={styles.changePackageText}>Request Package Change</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.beneficiariesSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Beneficiaries</Text>
                  <TouchableOpacity
                    style={styles.addBeneficiaryButtonSmall}
                    onPress={handleAddBeneficiary}
                  >
                    <Ionicons name="person-add-outline" size={20} color={Colors.gold} />
                    <Text style={styles.addBeneficiaryTextSmall}>Add</Text>
                  </TouchableOpacity>
                </View>

                {(() => {
                  const activeBeneficiaries = selectedPolicy.beneficiaries?.filter(
                    (b) => b.status === 0 || b.status === 1
                  ) || [];
                  
                  return activeBeneficiaries.length > 0 ? (
                    activeBeneficiaries.map(renderBeneficiaryCard)
                  ) : (
                    <View style={styles.emptyBeneficiaries}>
                      <Text style={styles.emptyBeneficiariesText}>No active beneficiaries</Text>
                    </View>
                  );
                })()}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <Modal
        visible={showViewPackagesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowViewPackagesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Packages</Text>
              <TouchableOpacity onPress={() => setShowViewPackagesModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {packages.length > 0 ? (
                packages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.packageId}
                    style={styles.viewPackageItem}
                    onPress={() => handleViewPackageDetail(pkg)}
                  >
                    <View style={styles.viewPackageHeader}>
                      <View>
                        <Text style={styles.viewPackageName}>{pkg.name}</Text>
                      </View>
                      <Text style={styles.viewPackagePrice}>
                        R {pkg.monthlyPremium.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.viewPackageDesc} numberOfLines={2}>
                      {pkg.description}
                    </Text>
                    <View style={styles.viewPackageFeatures}>
                      <View style={styles.viewFeatureTag}>
                        <Text style={styles.viewFeatureText}>
                          Max Beneficiaries: {pkg.maxBeneficiaries}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="grid-outline" size={60} color={Colors.textMuted} />
                  <Text style={styles.emptyStateText}>No packages available</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPackageDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPackageDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Package Details</Text>
              <TouchableOpacity onPress={() => setShowPackageDetailModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedPackage && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.packageDetailHeader}>
                  <Text style={styles.packageDetailName}>{selectedPackage.name}</Text>
                </View>

                <View style={styles.packageDetailPriceRow}>
                  <Text style={styles.packageDetailPrice}>
                    R {selectedPackage.monthlyPremium.toFixed(2)}
                  </Text>
                  <Text style={styles.packageDetailPriceLabel}> / month</Text>
                </View>

                <View style={styles.packageDetailDesc}>
                  <Text style={styles.packageDetailDescTitle}>Description</Text>
                  <Text style={styles.packageDetailDescText}>{selectedPackage.description}</Text>
                </View>

                <View style={styles.packageDetailFeatures}>
                  <Text style={styles.packageDetailFeaturesTitle}>Details</Text>
                  <View style={styles.packageDetailFeatureItem}>
                    <Ionicons name="people-outline" size={18} color={Colors.gold} />
                    <Text style={styles.packageDetailFeatureText}>
                      Max Beneficiaries: {selectedPackage.maxBeneficiaries}
                    </Text>
                  </View>
                </View>

                <View style={styles.packageDetailActions}>
                  <TouchableOpacity
                    style={styles.packageDetailActionButton}
                    onPress={() => {
                      setShowPackageDetailModal(false);
                      setShowViewPackagesModal(true);
                    }}
                  >
                    <Text style={styles.packageDetailActionText}>Back to List</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.packageDetailRequestButton}
                    onPress={confirmPackageChange}
                    disabled={isProcessing}
                  >
                    <Text style={styles.packageDetailRequestText}>
                      {isProcessing ? "SUBMITTING..." : "REQUEST THIS PACKAGE"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPackageChangeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPackageChangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Package</Text>
              <TouchableOpacity onPress={() => setShowPackageChangeModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalInfo}>Select a package to change to:</Text>
              {packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.packageId}
                  style={[
                    styles.viewPackageItem,
                    selectedPolicy?.packageId === pkg.packageId && styles.packageItemActive,
                  ]}
                  onPress={() => selectPackageToChange(pkg)}
                >
                  <View style={styles.viewPackageHeader}>
                    <View>
                      <Text style={styles.viewPackageName}>{pkg.name}</Text>
                    </View>
                    <Text style={styles.viewPackagePrice}>
                      R {pkg.monthlyPremium.toFixed(2)}
                    </Text>
                  </View>
                  {selectedPolicy?.packageId === pkg.packageId && (
                    <View style={styles.currentPackageBadge}>
                      <Text style={styles.currentPackageText}>Current Package</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddBeneficiaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddBeneficiaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Beneficiary</Text>
              <TouchableOpacity onPress={() => setShowAddBeneficiaryModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalInfo}>
                Enter beneficiary details for policy {selectedPolicy?.policyId?.substring(0, 8).toUpperCase()}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={[styles.modalInput, formErrors.fullName && styles.inputError]}
                  placeholder="e.g., John Doe"
                  placeholderTextColor={Colors.textMuted}
                  value={newBeneficiary.fullName}
                  onChangeText={(text) => {
                    setNewBeneficiary({ ...newBeneficiary, fullName: text });
                    setFormErrors({ ...formErrors, fullName: "" });
                  }}
                />
                {formErrors.fullName && <Text style={styles.errorText}>{formErrors.fullName}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Relationship *</Text>
                <TextInput
                  style={[styles.modalInput, formErrors.relationship && styles.inputError]}
                  placeholder="Spouse, Child, Parent, Sibling, Other"
                  placeholderTextColor={Colors.textMuted}
                  value={newBeneficiary.relationship}
                  onChangeText={(text) => {
                    setNewBeneficiary({ ...newBeneficiary, relationship: text });
                    setFormErrors({ ...formErrors, relationship: "" });
                  }}
                />
                {formErrors.relationship && (
                  <Text style={styles.errorText}>{formErrors.relationship}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>ID Number *</Text>
                <TextInput
                  style={[styles.modalInput, formErrors.idNumber && styles.inputError]}
                  placeholder="e.g., 900101 1234 567"
                  placeholderTextColor={Colors.textMuted}
                  value={newBeneficiary.idNumber}
                  onChangeText={(text) => {
                    setNewBeneficiary({ ...newBeneficiary, idNumber: text });
                    setFormErrors({ ...formErrors, idNumber: "" });
                  }}
                />
                {formErrors.idNumber && (
                  <Text style={styles.errorText}>{formErrors.idNumber}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Contact Number *</Text>
                <TextInput
                  style={[styles.modalInput, formErrors.contactNumber && styles.inputError]}
                  placeholder="e.g., +27 82 123 4567"
                  placeholderTextColor={Colors.textMuted}
                  value={newBeneficiary.contactNumber}
                  onChangeText={(text) => {
                    setNewBeneficiary({ ...newBeneficiary, contactNumber: text });
                    setFormErrors({ ...formErrors, contactNumber: "" });
                  }}
                />
                {formErrors.contactNumber && (
                  <Text style={styles.errorText}>{formErrors.contactNumber}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Allocation Percentage *</Text>
                <TextInput
                  style={[styles.modalInput, formErrors.allocationPercentage && styles.inputError]}
                  placeholder="e.g., 25 (for 25%)"
                  placeholderTextColor={Colors.textMuted}
                  value={newBeneficiary.allocationPercentage}
                  onChangeText={(text) => {
                    setNewBeneficiary({ ...newBeneficiary, allocationPercentage: text });
                    setFormErrors({ ...formErrors, allocationPercentage: "" });
                  }}
                  keyboardType="numeric"
                />
                {formErrors.allocationPercentage && (
                  <Text style={styles.errorText}>{formErrors.allocationPercentage}</Text>
                )}
              </View>

              <Button
                title={isProcessing ? "SUBMITTING..." : "SUBMIT REQUEST"}
                onPress={handleAddBeneficiarySubmit}
                disabled={isProcessing}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRemoveBeneficiaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRemoveBeneficiaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove Beneficiary</Text>
              <TouchableOpacity onPress={() => setShowRemoveBeneficiaryModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedBeneficiary && selectedPolicy && (
              <View style={styles.modalBody}>
                <View style={styles.removeBeneficiaryInfo}>
                  <Ionicons name="warning-outline" size={48} color={Colors.danger} />
                  <Text style={styles.removeBeneficiaryTitle}>
                    Remove {selectedBeneficiary.fullName}?
                  </Text>
                  <Text style={styles.removeBeneficiaryDescription}>
                    This will remove {selectedBeneficiary.fullName} ({getRelationshipLabel(selectedBeneficiary.relationship)}) from this policy.
                  </Text>
                  <View style={styles.removeBeneficiaryDetails}>
                    <Text style={styles.removeBeneficiaryDetail}>
                      ID: {selectedBeneficiary.idNumber}
                    </Text>
                    {selectedBeneficiary.contactNumber && (
                      <Text style={styles.removeBeneficiaryDetail}>
                        Contact: {selectedBeneficiary.contactNumber}
                      </Text>
                    )}
                    {selectedBeneficiary.allocationPercentage && (
                      <Text style={styles.removeBeneficiaryDetail}>
                        Allocation: {selectedBeneficiary.allocationPercentage}%
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.removeButtonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setShowRemoveBeneficiaryModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.confirmRemoveButton]}
                    onPress={confirmRemoveBeneficiary}
                    disabled={isProcessing}
                  >
                    <Text style={styles.confirmRemoveButtonText}>
                      {isProcessing ? "SUBMITTING..." : "REMOVE"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: Typography.heading.fontSize,
    fontWeight: Typography.heading.fontWeight,
    color: Colors.white,
  },
  content: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 12,
    fontSize: 16,
  },
  policyListItem: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  policyListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  policyListNumber: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  policyListName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginTop: 2,
  },
  policyListDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  policyListClient: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  policyListAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gold,
  },
  policyListArrow: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  separator: {
    height: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButtonText: {
    color: Colors.gold,
    fontSize: 16,
    marginLeft: 8,
  },
  policyCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  policyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  policyNumber: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  packageName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    marginTop: 2,
  },
  clientName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: Colors.success + "20",
  },
  pendingBadge: {
    backgroundColor: Colors.warning + "20",
  },
  inactiveBadge: {
    backgroundColor: Colors.textMuted + "20",
  },
  cancelledBadge: {
    backgroundColor: Colors.danger + "20",
  },
  expiredBadge: {
    backgroundColor: Colors.danger + "20",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  policyDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  policyDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  detailValue: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  viewPackagesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 12,
    paddingTop: 12,
  },
  viewPackagesText: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  changePackageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
    paddingTop: 12,
  },
  changePackageText: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  beneficiariesSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: Typography.subHeading.fontSize,
    fontWeight: Typography.subHeading.fontWeight,
    color: Colors.white,
  },
  addBeneficiaryButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 8,
  },
  addBeneficiaryTextSmall: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  beneficiaryCard: {
    backgroundColor: Colors.cardBackground,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  beneficiaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  beneficiaryInfo: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  beneficiaryRelationship: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  beneficiaryDetails: {
    marginTop: 4,
  },
  beneficiaryId: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  beneficiaryContact: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  beneficiaryPercentage: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: "500",
  },
  removeBeneficiaryButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  removeBeneficiaryText: {
    color: Colors.danger,
    fontSize: 14,
    marginLeft: 6,
  },
  emptyBeneficiaries: {
    padding: 20,
    alignItems: "center",
  },
  emptyBeneficiariesText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: Colors.textMuted,
    fontSize: 18,
    fontWeight: "500",
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  largeModal: {
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
  },
  modalBody: {
    paddingVertical: 8,
  },
  modalInfo: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  viewPackageItem: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  packageItemActive: {
    borderColor: Colors.gold,
    borderWidth: 2,
  },
  viewPackageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  viewPackageName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  viewPackagePrice: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.gold,
  },
  viewPackageDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 20,
  },
  viewPackageFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  viewFeatureTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  viewFeatureText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  viewMoreFeatures: {
    fontSize: 12,
    color: Colors.gold,
    paddingVertical: 4,
  },
  currentPackageBadge: {
    backgroundColor: Colors.gold + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  currentPackageText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "500",
  },
  packageDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  packageDetailName: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
    flex: 1,
  },
  packageDetailPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  packageDetailPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.gold,
  },
  packageDetailPriceLabel: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  packageDetailDesc: {
    marginBottom: 16,
  },
  packageDetailDescTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 6,
  },
  packageDetailDescText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  packageDetailFeatures: {
    marginBottom: 20,
  },
  packageDetailFeaturesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 10,
  },
  packageDetailFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  packageDetailFeatureText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 10,
  },
  packageDetailActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  packageDetailActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: "center",
  },
  packageDetailActionText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: "500",
  },
  packageDetailRequestButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    alignItems: "center",
  },
  packageDetailRequestText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  removeBeneficiaryInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  removeBeneficiaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
    marginTop: 12,
  },
  removeBeneficiaryDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  removeBeneficiaryDetails: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 10,
    width: "100%",
  },
  removeBeneficiaryDetail: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  removeButtonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  confirmRemoveButton: {
    backgroundColor: Colors.danger,
  },
  confirmRemoveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});