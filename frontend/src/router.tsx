import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import { RequireSession } from "./contexts/RequireSession";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const MockLoginPage = lazy(() => import("./pages/MockLoginPage"));
const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const StudentsListPage = lazy(() => import("./pages/StudentsListPage"));
const StudentProfilePage = lazy(() => import("./pages/StudentProfilePage"));
const AnnouncementsListPage = lazy(
  () => import("./pages/AnnouncementsListPage"),
);
const ClassroomsListPage = lazy(() => import("./pages/ClassroomsListPage"));
const TeachersListPage = lazy(() => import("./pages/TeachersListPage"));
const SubjectsListPage = lazy(() => import("./pages/SubjectsListPage"));
const SchoolsListPage = lazy(() => import("./pages/SchoolsListPage"));
const SchoolDetailPage = lazy(() => import("./pages/SchoolDetailPage"));
const PlatformAdminsPage = lazy(() => import("./pages/PlatformAdminsPage"));
const SuperadminPanelPage = lazy(() => import("./pages/SuperadminPanelPage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const HomeRedirect = lazy(() => import("./pages/HomeRedirect"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "login-mock", element: <MockLoginPage /> },
      {
        element: <RequireSession />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: "overview", element: <OverviewPage /> },
          { path: "attendance", element: <AttendancePage /> },
          { path: "students", element: <StudentsListPage /> },
          { path: "students/:id_student", element: <StudentProfilePage /> },
          { path: "announcements", element: <AnnouncementsListPage /> },
          { path: "classrooms", element: <ClassroomsListPage /> },
          { path: "teachers", element: <TeachersListPage /> },
          { path: "subjects", element: <SubjectsListPage /> },
          { path: "panel", element: <SuperadminPanelPage /> },
          { path: "schools", element: <SchoolsListPage /> },
          { path: "schools/:id_school", element: <SchoolDetailPage /> },
          { path: "platform-admins", element: <PlatformAdminsPage /> },
          { path: "portfolio", element: <PortfolioPage /> },
          { path: "*", element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
