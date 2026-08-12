"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Header from "@/components/profile/Header";
import PersonalInformation from "@/components/profile/PersonalInformation";
import AccountInformation from "@/components/profile/AccountInformation";
import Security from "@/components/profile/Security";
import ProfileMetricCard from "@/components/dashboard/metriccard/staff/ProfileMetricCard";

export default function ProfilePage(){
    React.useEffect(()=> {
        document.title = "My Profile";
    }, []);

    return(
        <div className="space-y-6">
            {/*BreadCrumb */}
            <PageBreadcrumb pageTitle="My Profile" />

            {/*Profile Header + Summary */}
            <div className="grid grid-cols-12 gap-6">
                {/*Profile Header */}
                <div className="lg:col-span-4">
                    <Header
                    fullName="John Doe"
                    role="Driver"
                    email="john.doe@legacycare.co.za"
                    phone="012 345 6789"
                    joined="2023-04-05"
                    />
                </div>
            
                <div className="lg:col-span-8">
                    {/*Metric Card */}
                        <ProfileMetricCard
                        totTasks={55}
                        pendingTasks={10}
                        />
                </div>

                {/*Personal Information + Security + Account Information */}
                <div className="flex items-center col-span-12 gap-4 ">
                    
                    {/*Personal Information */}
                    <div className="lg:col-span-6">
                        <PersonalInformation
                        email= "john.doe@legacycare.co.za"
                        phone="012 345 6789"
                        address="123 Milky Lane Str."
                        idNumber="0611123456789"
                        />
                    </div>

                    {/*Account Information */}
                    <div className="lg:col-span-6">
                        <AccountInformation
                        role="Driver"
                        status="Active"
                        createdDate="2023-06-23"
                        lastLogin="2026-01-12"
                        />
                    </div>

                    <div className="lg:col-span-6">
                        <Security 
                        onChangePassword={()=>{
                            console.log("Change Password");
                        }}
                        />
                    </div>
                    

                </div>
            </div>
        </div>
    );
}