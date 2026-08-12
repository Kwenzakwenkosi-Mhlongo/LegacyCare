import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

interface Payment {
  paymentId: string;
  amount: number;
  paymentDate: string;
  dueDate?: string;
  method: string;
  status: string;
  policyId: string;
  policy?: {
    policyId: string;
    package?: {
      name: string;
    };
  };
}

interface PaymentMethod {
  paymentMethodId: string;
  method: string;
  accountReference: string;
  isDefault: boolean;
  userId: string;
}

const methodLabels: Record<string, string> = {
  "CASH": "Cash",
  "CARD": "Card", 
  "EFT": "EFT"
};

const statusLabels: Record<string, string> = {
  "PENDING": "Pending",
  "SUCCESSFUL": "Successful",
  "FAILED": "Failed"
};

const paymentTypeLabels = ["Cash", "Card", "EFT"];
const paymentTypeValues = ["CASH", "CARD", "EFT"];

export default function PaymentsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"history" | "outstanding">("history");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [outstandingPayments, setOutstandingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number>(0);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [showUpdateMethodModal, setShowUpdateMethodModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);
  const [selectedMethodForUpdate, setSelectedMethodForUpdate] = useState<PaymentMethod | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("CARD");

  const [paymentMethod, setPaymentMethod] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: "",
    accountReference: "",
    bankName: "",
    accountNumber: "",
    branchCode: "",
    methodType: "CARD",
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

  const loadPaymentData = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();

      const [paymentResponse, outstandingResponse] = await Promise.all([
        fetch(`${API_URL}/Payment/history`, { headers }),
        fetch(`${API_URL}/Payment/outstanding`, { headers }),
      ]);

      if (paymentResponse.ok) {
        const data = await paymentResponse.json();
        setPayments(data || []);
      } else {
        if (paymentResponse.status === 401) {
          setError("Session expired. Please login again.");
        } else {
          setError("Unable to load payments.");
        }
      }

      if (outstandingResponse.ok) {
        const data = await outstandingResponse.json();
        setOutstandingPayments(data || []);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userId]);

  const loadPaymentMethods = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/PaymentMethod`, { headers });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data || []);
      }
    } catch {
    }
  }, [user?.userId]);

  useEffect(() => {
    loadPaymentData();
    loadPaymentMethods();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPaymentData(), loadPaymentMethods()]);
    setRefreshing(false);
  };

  const getMethodLabel = (method: string) => {
    return methodLabels[method] || method || "Unknown";
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status || "Unknown";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2)}`;
  };

  const handleMakePayment = (payment: Payment) => {
    const defaultMethod = paymentMethods.find(pm => pm.isDefault) || paymentMethods[0];
    
    if (!defaultMethod) {
      Alert.alert(
        "No Payment Method",
        "You don't have a payment method saved. Please add one first.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Add Method", onPress: () => setShowAddMethodModal(true) },
        ]
      );
      return;
    }

    setSelectedPayment(payment);
    setSelectedPaymentType(defaultMethod.method);
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedPayment) return;

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/Payment/${selectedPayment.paymentId}/confirm`, {
        method: "POST",
        headers,
        body: JSON.stringify({ method: selectedPaymentType }),
      });

      if (response.ok) {
        const payment = await response.json();
        setShowPaymentModal(false);
        setSelectedPayment(null);
        
        if (payment.status === "SUCCESSFUL") {
          const methodName = getMethodLabel(selectedPaymentType);
          Alert.alert(
            "Payment Successful",
            `Your payment of ${formatCurrency(selectedPayment.amount)} has been processed successfully using ${methodName}.`
          );
        } else {
          Alert.alert(
            "Payment Failed",
            "Your payment could not be processed. Please try again."
          );
        }
        
        await loadPaymentData();
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText || "Failed to process payment.");
      }
    } catch {
      Alert.alert("Error", "Failed to process payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePaymentMethod = () => {
    const savedMethods = paymentMethods.filter(pm => pm.method !== selectedPaymentType);
    
    if (savedMethods.length === 0) {
      Alert.alert(
        "No Other Methods",
        "You only have one payment method saved. Add a new one first.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Add Method", onPress: () => {
            setShowPaymentModal(false);
            setShowAddMethodModal(true);
          }},
        ]
      );
      return;
    }

    Alert.alert(
      "Select Payment Method",
      "Choose a saved payment method:",
      savedMethods.map((method) => ({
        text: `${getMethodLabel(method.method)}${method.isDefault ? " (Default)" : ""}`,
        onPress: () => {
          setSelectedPaymentType(method.method);
        },
      })),
      { cancelable: true }
    );
  };

  const handleDownloadInvoice = (payment: Payment) => {
    setSelectedInvoice(payment);
    setShowInvoiceModal(true);
  };

  const confirmDownloadInvoice = async () => {
    if (!selectedInvoice) return;

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/Invoice/payment/${selectedInvoice.paymentId}`, {
        method: "POST",
        headers,
      });

      if (response.ok) {
        const invoice = await response.json();
        setShowInvoiceModal(false);
        setSelectedInvoice(null);
        Alert.alert("Success", `Invoice ${invoice.invoiceRef} generated successfully.`);
        await loadPaymentData();
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText || "Failed to generate invoice.");
      }
    } catch {
      Alert.alert("Error", "Failed to generate invoice. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateMethod = (method: PaymentMethod) => {
    setSelectedMethodForUpdate(method);
    setSelectedPaymentType(method.method);

    setPaymentMethod({
      cardNumber: method.method === "CARD" ? "**** **** **** 1234" : "",
      expiryDate: "12/26",
      cvv: "***",
      cardHolder: "",
      accountReference: method.accountReference,
      bankName: method.method === "EFT" ? "ABSA" : "",
      accountNumber: method.method === "EFT" ? "1234567890" : "",
      branchCode: method.method === "EFT" ? "123456" : "",
      methodType: method.method,
    });

    setShowUpdateMethodModal(true);
  };

  const confirmUpdatePaymentMethod = async () => {
    if (!selectedMethodForUpdate) return;

    if (!validatePaymentMethod()) {
      Alert.alert("Invalid Information", "Please check the form for errors and try again.");
      return;
    }

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();

      let accountReference = "";
      if (selectedPaymentType === "CARD") {
        accountReference = `Card ending ${paymentMethod.cardNumber.slice(-4)}`;
      } else if (selectedPaymentType === "EFT") {
        accountReference = `${paymentMethod.bankName} - ${paymentMethod.accountNumber.slice(-4)}`;
      } else {
        accountReference = `Cash - ${paymentMethod.cardHolder}`;
      }

      const requestData = {
        method: selectedPaymentType,
        accountReference: accountReference,
        isDefault: paymentMethods.length === 1,
      };

      const response = await fetch(`${API_URL}/PaymentMethod/${selectedMethodForUpdate.paymentMethodId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        await loadPaymentMethods();
        setShowUpdateMethodModal(false);
        setSelectedMethodForUpdate(null);
        resetPaymentForm();
        Alert.alert("Success", "Payment method updated successfully.");
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText || "Failed to update payment method.");
      }
    } catch {
      Alert.alert("Error", "Failed to update payment method. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPaymentForm = () => {
    setPaymentMethod({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardHolder: "",
      accountReference: "",
      bankName: "",
      accountNumber: "",
      branchCode: "",
      methodType: "CARD",
    });
    setFormErrors({});
    setSelectedPaymentType("CARD");
  };

  const validatePaymentMethod = () => {
    const errors: Record<string, string> = {};

    if (selectedPaymentType === "CASH") {
      if (!paymentMethod.cardHolder || paymentMethod.cardHolder.length < 2) {
        errors.cardHolder = "Please enter full name for cash payment";
      }
    } else if (selectedPaymentType === "CARD") {
      const cleanedCard = paymentMethod.cardNumber.replace(/\s/g, "");
      if (!cleanedCard || cleanedCard.length < 16) {
        errors.cardNumber = "Please enter a valid 16-digit card number";
      }

      if (!paymentMethod.expiryDate) {
        errors.expiryDate = "Please enter expiry date";
      } else {
        const [month, year] = paymentMethod.expiryDate.split("/");
        if (!month || !year || month.length !== 2 || year.length !== 2) {
          errors.expiryDate = "Please use MM/YY format";
        }
        const currentYear = new Date().getFullYear() % 100;
        if (parseInt(year) < currentYear) {
          errors.expiryDate = "Card has expired";
        }
      }

      if (!paymentMethod.cvv || paymentMethod.cvv.length < 3) {
        errors.cvv = "Please enter a valid CVV";
      }

      if (!paymentMethod.cardHolder || paymentMethod.cardHolder.length < 2) {
        errors.cardHolder = "Please enter card holder name";
      }
    } else if (selectedPaymentType === "EFT") {
      if (!paymentMethod.bankName || paymentMethod.bankName.length < 2) {
        errors.bankName = "Please enter bank name";
      }
      if (!paymentMethod.accountNumber || paymentMethod.accountNumber.length < 6) {
        errors.accountNumber = "Please enter valid account number";
      }
      if (!paymentMethod.branchCode || paymentMethod.branchCode.length < 4) {
        errors.branchCode = "Please enter branch code";
      }
      if (!paymentMethod.cardHolder || paymentMethod.cardHolder.length < 2) {
        errors.cardHolder = "Please enter account holder name";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPaymentMethod = async () => {
    if (!validatePaymentMethod()) {
      Alert.alert("Invalid Information", "Please check the form for errors and try again.");
      return;
    }

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();

      let accountReference = "";
      if (selectedPaymentType === "CARD") {
        accountReference = `Card ending ${paymentMethod.cardNumber.slice(-4)}`;
      } else if (selectedPaymentType === "EFT") {
        accountReference = `${paymentMethod.bankName} - ${paymentMethod.accountNumber.slice(-4)}`;
      } else {
        accountReference = `Cash - ${paymentMethod.cardHolder}`;
      }

      const requestData = {
        method: selectedPaymentType,
        accountReference: accountReference,
        isDefault: paymentMethods.length === 0,
      };

      const response = await fetch(`${API_URL}/PaymentMethod`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        await loadPaymentMethods();
        setShowAddMethodModal(false);
        resetPaymentForm();
        
        Alert.alert("Success", "Payment method added successfully.");
        
        if (pendingPaymentId) {
          const confirmResponse = await fetch(`${API_URL}/Payment/${pendingPaymentId}/confirm`, {
            method: "POST",
            headers,
            body: JSON.stringify({ method: selectedPaymentType }),
          });

          if (confirmResponse.ok) {
            const payment = await confirmResponse.json();
            setPendingPaymentId(null);
            setPendingAmount(0);
            
            if (payment.status === "SUCCESSFUL") {
              Alert.alert(
                "Payment Successful",
                `Your payment of ${formatCurrency(pendingAmount)} has been processed successfully.`
              );
            } else {
              Alert.alert(
                "Payment Failed",
                "Your payment could not be processed. Please try again."
              );
            }
            
            await loadPaymentData();
          }
        }
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText || "Failed to add payment method.");
      }
    } catch {
      Alert.alert("Error", "Failed to add payment method. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    Alert.alert("Delete Payment Method", "Are you sure you want to delete this payment method?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsProcessing(true);
          try {
            const headers = await getAuthHeaders();

            const response = await fetch(`${API_URL}/PaymentMethod/${methodId}`, {
              method: "DELETE",
              headers,
            });

            if (response.ok) {
              await loadPaymentMethods();
              Alert.alert("Success", "Payment method deleted successfully.");
            } else {
              const errorText = await response.text();
              Alert.alert("Error", errorText || "Failed to delete payment method.");
            }
          } catch {
            Alert.alert("Error", "Failed to delete payment method. Please try again.");
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const renderPaymentMethodTypes = () => {
    return (
      <View style={styles.typeContainer}>
        {paymentTypeLabels.map((label, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.typeButton,
              selectedPaymentType === paymentTypeValues[index] && styles.typeButtonActive,
            ]}
            onPress={() => {
              setSelectedPaymentType(paymentTypeValues[index]);
              setFormErrors({});
            }}
          >
            <Text
              style={[
                styles.typeButtonText,
                selectedPaymentType === paymentTypeValues[index] && styles.typeButtonTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPaymentFormFields = () => {
    if (selectedPaymentType === "CASH") {
      return (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={[styles.modalInput, formErrors.cardHolder && styles.inputError]}
              placeholder="John Doe"
              placeholderTextColor={Colors.textMuted}
              value={paymentMethod.cardHolder}
              onChangeText={(text) => {
                setPaymentMethod({ ...paymentMethod, cardHolder: text });
                setFormErrors({ ...formErrors, cardHolder: "" });
              }}
            />
            {formErrors.cardHolder && <Text style={styles.errorText}>{formErrors.cardHolder}</Text>}
          </View>
          <Text style={styles.infoText}>Cash payments are recorded manually.</Text>
        </>
      );
    }

    if (selectedPaymentType === "CARD") {
      return (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Card Number *</Text>
            <TextInput
              style={[styles.modalInput, formErrors.cardNumber && styles.inputError]}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={Colors.textMuted}
              value={paymentMethod.cardNumber}
              onChangeText={(text) => {
                setPaymentMethod({ ...paymentMethod, cardNumber: text });
                setFormErrors({ ...formErrors, cardNumber: "" });
              }}
              keyboardType="numeric"
            />
            {formErrors.cardNumber && <Text style={styles.errorText}>{formErrors.cardNumber}</Text>}
          </View>
          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>Expiry Date *</Text>
              <TextInput
                style={[styles.modalInput, formErrors.expiryDate && styles.inputError]}
                placeholder="MM/YY"
                placeholderTextColor={Colors.textMuted}
                value={paymentMethod.expiryDate}
                onChangeText={(text) => {
                  let formatted = text;
                  if (text.length === 2 && !text.includes("/")) {
                    formatted = text + "/";
                  }
                  setPaymentMethod({ ...paymentMethod, expiryDate: formatted });
                  setFormErrors({ ...formErrors, expiryDate: "" });
                }}
                maxLength={5}
              />
              {formErrors.expiryDate && <Text style={styles.errorText}>{formErrors.expiryDate}</Text>}
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.inputLabel}>CVV *</Text>
              <TextInput
                style={[styles.modalInput, formErrors.cvv && styles.inputError]}
                placeholder="123"
                placeholderTextColor={Colors.textMuted}
                value={paymentMethod.cvv}
                onChangeText={(text) => {
                  setPaymentMethod({ ...paymentMethod, cvv: text });
                  setFormErrors({ ...formErrors, cvv: "" });
                }}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
              />
              {formErrors.cvv && <Text style={styles.errorText}>{formErrors.cvv}</Text>}
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Card Holder Name *</Text>
            <TextInput
              style={[styles.modalInput, formErrors.cardHolder && styles.inputError]}
              placeholder="John Doe"
              placeholderTextColor={Colors.textMuted}
              value={paymentMethod.cardHolder}
              onChangeText={(text) => {
                setPaymentMethod({ ...paymentMethod, cardHolder: text });
                setFormErrors({ ...formErrors, cardHolder: "" });
              }}
            />
            {formErrors.cardHolder && <Text style={styles.errorText}>{formErrors.cardHolder}</Text>}
          </View>
        </>
      );
    }

    if (selectedPaymentType === "EFT") {
      return (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Account Holder Name *</Text>
            <TextInput
              style={[styles.modalInput, formErrors.cardHolder && styles.inputError]}
              placeholder="John Doe"
              placeholderTextColor={Colors.textMuted}
              value={paymentMethod.cardHolder}
              onChangeText={(text) => {
                setPaymentMethod({ ...paymentMethod, cardHolder: text });
                setFormErrors({ ...formErrors, cardHolder: "" });
              }}
            />
            {formErrors.cardHolder && <Text style={styles.errorText}>{formErrors.cardHolder}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bank Name *</Text>
            <TextInput
              style={[styles.modalInput, formErrors.bankName && styles.inputError]}
              placeholder="ABSA, FNB, Nedbank, etc."
              placeholderTextColor={Colors.textMuted}
              value={paymentMethod.bankName}
              onChangeText={(text) => {
                setPaymentMethod({ ...paymentMethod, bankName: text });
                setFormErrors({ ...formErrors, bankName: "" });
              }}
            />
            {formErrors.bankName && <Text style={styles.errorText}>{formErrors.bankName}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Account Number *</Text>
            <TextInput
              style={[styles.modalInput, formErrors.accountNumber && styles.inputError]}
              placeholder="1234567890"
              placeholderTextColor={Colors.textMuted}
              value={paymentMethod.accountNumber}
              onChangeText={(text) => {
                setPaymentMethod({ ...paymentMethod, accountNumber: text });
                setFormErrors({ ...formErrors, accountNumber: "" });
              }}
              keyboardType="numeric"
            />
            {formErrors.accountNumber && <Text style={styles.errorText}>{formErrors.accountNumber}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Branch Code *</Text>
            <TextInput
              style={[styles.modalInput, formErrors.branchCode && styles.inputError]}
              placeholder="123456"
              placeholderTextColor={Colors.textMuted}
              value={paymentMethod.branchCode}
              onChangeText={(text) => {
                setPaymentMethod({ ...paymentMethod, branchCode: text });
                setFormErrors({ ...formErrors, branchCode: "" });
              }}
              keyboardType="numeric"
            />
            {formErrors.branchCode && <Text style={styles.errorText}>{formErrors.branchCode}</Text>}
          </View>
        </>
      );
    }

    return null;
  };

  const renderPaymentCard = (payment: Payment, showPayButton: boolean = false) => {
    const statusLabel = getStatusLabel(payment.status);
    const isOutstanding = payment.status === "PENDING";
    const isFailed = payment.status === "FAILED";
    const methodLabel = getMethodLabel(payment.method);

    return (
      <View key={payment.paymentId} style={[styles.paymentCard, (isOutstanding || isFailed) && styles.outstandingCard]}>
        <View style={styles.paymentHeader}>
          <Text style={styles.paymentDescription}>
            {payment.policy?.package?.name || "Payment"}
          </Text>
          <Text style={[styles.paymentAmount, (isOutstanding || isFailed) ? { color: Colors.danger } : { color: Colors.gold }]}>
            {formatCurrency(payment.amount)}
          </Text>
        </View>

        <View style={styles.paymentDetails}>
          {!showPayButton ? (
            <Text style={styles.paymentDate}>
              {formatDate(payment.paymentDate)}
            </Text>
          ) : (
            <Text style={styles.paymentDueLabel}>Due:</Text>
          )}
          {!showPayButton ? (
            <View style={[styles.statusBadge, (isOutstanding || isFailed) && styles.outstandingBadge]}>
              <Text style={[styles.statusText, (isOutstanding || isFailed) && { color: Colors.danger }]}>
                {statusLabel}
              </Text>
            </View>
          ) : (
            <Text style={styles.paymentDueValue}>
              {payment.dueDate ? formatDate(payment.dueDate) : "N/A"}
            </Text>
          )}
        </View>

        <View style={styles.paymentDueDate}>
          <Text style={styles.paymentDueLabel}>Due Date:</Text>
          <Text style={styles.paymentDueValue}>
            {payment.dueDate ? formatDate(payment.dueDate) : "N/A"}
          </Text>
        </View>

        <View style={styles.paymentMethodContainer}>
          <Ionicons name="card-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.paymentMethod}>{methodLabel}</Text>
        </View>

        <View style={styles.paymentActions}>
          {!showPayButton ? (
            <>
              {payment.status === "SUCCESSFUL" && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleDownloadInvoice(payment)}>
                  <Ionicons name="download-outline" size={20} color={Colors.gold} />
                  <Text style={styles.actionButtonText}>Invoice</Text>
                </TouchableOpacity>
              )}
              {payment.status === "FAILED" && (
                <TouchableOpacity style={styles.retryBtn} onPress={() => handleMakePayment(payment)}>
                  <Ionicons name="refresh-outline" size={20} color={Colors.white} />
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert(
                    "Payment Details",
                    `Amount: ${formatCurrency(payment.amount)}\nDate: ${formatDate(payment.paymentDate)}\nDue Date: ${payment.dueDate ? formatDate(payment.dueDate) : "N/A"}\nStatus: ${statusLabel}\nMethod: ${methodLabel}\nPolicy: ${payment.policy?.package?.name || "N/A"}`
                  );
                }}
              >
                <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
                <Text style={[styles.actionButtonText, { color: Colors.textSecondary }]}>Details</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.payButton} onPress={() => handleMakePayment(payment)}>
              <Text style={styles.payButtonText}>Make Payment</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && !payments.length) {
    return (
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddMethodModal(true)}>
          <Ionicons name="add-circle-outline" size={28} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>Payment History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "outstanding" && styles.activeTab]}
          onPress={() => setActiveTab("outstanding")}
        >
          <Text style={[styles.tabText, activeTab === "outstanding" && styles.activeTabText]}>Outstanding</Text>
          {outstandingPayments.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{outstandingPayments.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={Colors.danger} />
            <Text style={styles.errorStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Pull to Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeTab === "history" ? (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Payments</Text>
                  <TouchableOpacity onPress={loadPaymentData}>
                    <Text style={styles.refreshText}>Refresh</Text>
                  </TouchableOpacity>
                </View>

                {payments.length > 0 ? (
                  payments.map((payment) => renderPaymentCard(payment, false))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={60} color={Colors.textMuted} />
                    <Text style={styles.emptyStateText}>No payment history</Text>
                    <Text style={styles.emptyStateSubtext}>Your payments will appear here</Text>
                  </View>
                )}
              </View>
            ) : (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Outstanding Payments</Text>
                  <TouchableOpacity onPress={loadPaymentData}>
                    <Text style={styles.refreshText}>Refresh</Text>
                  </TouchableOpacity>
                </View>

                {outstandingPayments.length > 0 ? (
                  outstandingPayments.map((payment) => renderPaymentCard(payment, true))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="checkmark-circle-outline" size={60} color={Colors.success} />
                    <Text style={styles.emptyStateText}>You are up to date!</Text>
                    <Text style={styles.emptyStateSubtext}>No outstanding payments</Text>
                  </View>
                )}
              </View>
            )}

            {paymentMethods.length > 0 && (
              <View style={styles.methodsContainer}>
                <Text style={styles.methodsTitle}>Saved Payment Methods</Text>
                {paymentMethods.map((method) => (
                  <View key={method.paymentMethodId} style={styles.methodCard}>
                    <Ionicons name="card-outline" size={24} color={Colors.gold} />
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodCardNumber}>{getMethodLabel(method.method)}</Text>
                      <Text style={styles.methodDetails}>
                        {method.accountReference}
                        {method.isDefault && <Text style={styles.defaultBadge}> Default</Text>}
                      </Text>
                    </View>
                    <View style={styles.methodActions}>
                      <TouchableOpacity onPress={() => handleUpdateMethod(method)} style={styles.methodActionButton}>
                        <Ionicons name="pencil-outline" size={20} color={Colors.gold} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteMethod(method.paymentMethodId)} style={styles.methodActionButton}>
                        <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showPaymentModal} transparent animationType="slide" onRequestClose={() => setShowPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedPayment && (
              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Amount:</Text>
                  <Text style={[styles.modalValue, { color: Colors.gold, fontWeight: "700" }]}>
                    {formatCurrency(selectedPayment.amount)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Policy:</Text>
                  <Text style={styles.modalValue}>{selectedPayment.policy?.package?.name || "N/A"}</Text>
                </View>
                <View style={styles.modalDivider} />
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodLabel}>Payment Method:</Text>
                  <Text style={styles.paymentMethodValue}>
                    {getMethodLabel(selectedPaymentType)}
                    {paymentMethods.find(pm => pm.method === selectedPaymentType && pm.isDefault) && " (Default)"}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.changeMethodButton}
                  onPress={handleChangePaymentMethod}
                >
                  <Text style={styles.changeMethodText}>Change</Text>
                </TouchableOpacity>
                <Button 
                  title={isProcessing ? "PROCESSING..." : "CONFIRM PAYMENT"} 
                  onPress={confirmPayment} 
                  disabled={isProcessing} 
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showInvoiceModal} transparent animationType="slide" onRequestClose={() => setShowInvoiceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Download Invoice</Text>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedInvoice && (
              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Amount:</Text>
                  <Text style={[styles.modalValue, { color: Colors.gold }]}>
                    {formatCurrency(selectedInvoice.amount)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Date:</Text>
                  <Text style={styles.modalValue}>{formatDate(selectedInvoice.paymentDate)}</Text>
                </View>
                <View style={styles.modalDivider} />
                <Text style={styles.modalInfo}>The invoice will be downloaded as a PDF file.</Text>
                <Button title={isProcessing ? "GENERATING..." : "DOWNLOAD PDF"} onPress={confirmDownloadInvoice} disabled={isProcessing} />
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showAddMethodModal} transparent animationType="slide" onRequestClose={() => setShowAddMethodModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <TouchableOpacity onPress={() => setShowAddMethodModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Payment Type *</Text>
                {renderPaymentMethodTypes()}
              </View>
              {renderPaymentFormFields()}
              <Button title={isProcessing ? "SAVING..." : "SAVE PAYMENT METHOD"} onPress={handleAddPaymentMethod} disabled={isProcessing} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showUpdateMethodModal} transparent animationType="slide" onRequestClose={() => setShowUpdateMethodModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Payment Method</Text>
              <TouchableOpacity onPress={() => setShowUpdateMethodModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Payment Type *</Text>
                {renderPaymentMethodTypes()}
              </View>
              {renderPaymentFormFields()}
              <Button title={isProcessing ? "UPDATING..." : "UPDATE PAYMENT METHOD"} onPress={confirmUpdatePaymentMethod} disabled={isProcessing} />
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: Typography.heading.fontSize,
    fontWeight: Typography.heading.fontWeight,
    color: Colors.white,
  },
  addButton: { padding: 4 },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomColor: Colors.gold,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    color: Colors.gold,
  },
  badge: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  content: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  errorStateText: {
    color: Colors.textMuted,
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 20,
  },
  retryButtonText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Typography.subHeading.fontSize,
    fontWeight: Typography.subHeading.fontWeight,
    color: Colors.white,
  },
  refreshText: {
    color: Colors.gold,
    fontSize: 14,
  },
  paymentCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  outstandingCard: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  paymentDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentDate: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  paymentDueLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  paymentDueValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  paymentDueDate: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  paymentMethodContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  paymentMethod: {
    fontSize: 13,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  statusBadge: {
    backgroundColor: Colors.success + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  outstandingBadge: {
    backgroundColor: Colors.danger + "20",
  },
  statusText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: "500",
  },
  paymentActions: {
    flexDirection: "row",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionButtonText: {
    color: Colors.gold,
    fontSize: 14,
    marginLeft: 4,
  },
  payButton: {
    flex: 1,
    backgroundColor: Colors.gold,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  payButtonText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  retryBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
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
  methodsContainer: {
    marginTop: 16,
  },
  methodsTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  methodInfo: {
    marginLeft: 12,
    flex: 1,
  },
  methodCardNumber: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  methodDetails: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  defaultBadge: {
    color: Colors.gold,
    fontWeight: "700",
  },
  methodActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  methodActionButton: {
    padding: 4,
    marginLeft: 8,
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
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  modalLabel: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  modalValue: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  paymentMethodInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentMethodLabel: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  paymentMethodValue: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  changeMethodButton: {
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  changeMethodText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: "500",
  },
  modalInfo: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
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
  rowInputs: {
    flexDirection: "row",
  },
  typeContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginRight: 8,
  },
  typeButtonActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.gold + "20",
  },
  typeButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  typeButtonTextActive: {
    color: Colors.gold,
    fontWeight: "600",
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
});