import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';
import ReactPlaceholder from 'react-placeholder';

import { ProjectNav } from '../components/projects/projectNav';
import { MyProjectNav } from '../components/projects/myProjectNav';
import { MoreFiltersForm } from '../components/projects/moreFiltersForm';
import { ProjectDetail } from '../components/projectDetail/index';
import { ProjectCardPaginator } from '../components/projects/projectCardPaginator';
import { ProjectSearchResults } from '../components/projects/projectSearchResults';
import { ProjectsMap } from '../components/projects/projectsMap';
import PrivateProjectError from '../components/projectDetail/privateProjectError';
import {
  useProjectsQueryAPI,
  useExploreProjectsQueryParams,
  stringify,
} from '../hooks/UseProjectsQueryAPI';
import useForceUpdate from '../hooks/UseForceUpdate';
import { useFetch } from '../hooks/UseFetch';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { NotFound } from './notFound';
import { ProjectDetailPlaceholder } from '../components/projectDetail/projectDetailPlaceholder';

const ProjectCreate = React.lazy(() => import('../components/projectCreate/index'));

export const CreateProject = (props) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectCreate {...props} />
    </Suspense>
  );
};

export const ProjectsPage = (props) => {
  useSetTitleTag('Explore projects');
  const initialData = {
    mapResults: {
      features: [],
      type: 'FeatureCollection',
    },
    results: [],
    pagination: { hasNext: false, hasPrev: false, page: 1 },
  };

  const [fullProjectsQuery, setProjectQuery] = useExploreProjectsQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [state] = useProjectsQueryAPI(initialData, fullProjectsQuery, forceUpdated);

  const isMapShown = useSelector((state) => state.preferences['mapShown']);
  const searchResultWidth = isMapShown ? 'two-column' : 'one-column';

  return (
    <div className="pull-center">
      <ProjectNav location={props.location}>
        {
          props.children
          /* This is where the MoreFilters component is rendered
        using the router, as a child route.
        */
        }
      </ProjectNav>
      <section className={`${searchResultWidth} explore-projects-container`}>
        <div>
          <ProjectSearchResults
            state={state}
            retryFn={forceUpdate}
            className={`${isMapShown ? 'pl3' : 'ph3'}`}
          />
          <ProjectCardPaginator projectAPIstate={state} setQueryParam={setProjectQuery} />
        </div>
        {isMapShown && (
          <div className="explore-projects-map">
            <ProjectsMap
              state={state}
              fullProjectsQuery={fullProjectsQuery}
              setQuery={setProjectQuery}
            />
          </div>
        )}
      </section>
    </div>
  );
};

export const UserProjectsPage = (props) => {
  useSetTitleTag(props.management ? 'Manage projects' : 'My projects');
  const userToken = useSelector((state) => state.auth.token);

  const initialData = {
    mapResults: {
      features: [],
      type: 'FeatureCollection',
    },
    results: [],
    pagination: { hasNext: false, hasPrev: false, page: 1 },
  };

  const [fullProjectsQuery, setProjectQuery] = useExploreProjectsQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [state] = useProjectsQueryAPI(initialData, fullProjectsQuery, forceUpdated);

  const isMapShown = useSelector((state) => state.preferences['mapShown']);
  const searchResultWidth = isMapShown ? 'two-column' : 'one-column';

  if (!userToken) {
    /* use replace to so the back button does not get interrupted */
    props.navigate('/login', { replace: true });
  }

  if (
    !fullProjectsQuery.createdByMe &&
    !fullProjectsQuery.managedByMe &&
    !fullProjectsQuery.mappedByMe &&
    !fullProjectsQuery.favoritedByMe &&
    !fullProjectsQuery.status
  ) {
    setProjectQuery({ managedByMe: true });
  }

  return (
    <div className="pull-center">
      <MyProjectNav location={props.location} management={props.management} />
      <section className={`${searchResultWidth} explore-projects-container`}>
        <div className="">
          <ProjectSearchResults
            state={state}
            retryFn={forceUpdate}
            showBottomButtons={props.location && props.location.pathname.startsWith('/manage/')}
            management={props.management}
          />
          <ProjectCardPaginator projectAPIstate={state} setQueryParam={setProjectQuery} />
        </div>
        {isMapShown && (
          <div className="explore-projects-map">
            <ProjectsMap
              state={state}
              fullProjectsQuery={fullProjectsQuery}
              setQuery={setProjectQuery}
            />
          </div>
        )}
      </section>
    </div>
  );
};

export const ProjectsPageIndex = (props) => {
  return null;
};

export const MoreFilters = (props) => {
  const [fullProjectsQuery] = useExploreProjectsQueryParams();

  const currentUrl = `/explore${
    stringify(fullProjectsQuery) ? ['?', stringify(fullProjectsQuery)].join('') : ''
  }`;

  return (
    <>
      <div className="absolute left-0 z-4 mt1 w-40-l w-100 h-100 bg-white h4 ph1 ph5-l">
        <MoreFiltersForm currentUrl={currentUrl} />
      </div>
      <div
        onClick={() => props.navigate(currentUrl)}
        className="absolute right-0 z-4 br w-60-l w-0 h-100 bg-blue-dark o-70 h6"
      />
    </>
  );
};

export const ProjectDetailPage = (props) => {
  const [error, loading, data] = useFetch(`projects/${props.id}/`, props.id);

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      customPlaceholder={<ProjectDetailPlaceholder />}
      delay={1000}
      ready={loading === false}
    >
      {!error && (
        <ProjectDetail
          project={data}
          projectLoading={loading}
          tasksError={error}
          tasks={data.tasks}
          navigate={props.navigate}
          type="detail"
        />
      )}
      {error && (
        <>
          {error.message === 'PrivateProject' ? (
            <PrivateProjectError />
          ) : (
            <NotFound projectId={props.id} />
          )}
        </>
      )}
    </ReactPlaceholder>
  );
};

export const ManageProjectsPage = (props) => <UserProjectsPage {...props} management={true} />;
